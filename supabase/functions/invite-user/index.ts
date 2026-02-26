import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only admins can invite users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, role, temp_password, app_access } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Email and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create user - use temp_password if provided, otherwise generate a random one
      const password = temp_password || crypto.randomUUID() + "!Aa1";
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.user.id;
    }

    // Upsert the role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile to approved + store email
    await adminClient
      .from("profiles")
      .update({ role: "approved", full_name: full_name || email, email })
      .eq("user_id", userId);

    // Handle app access grants
    if (Array.isArray(app_access)) {
      // Remove existing access
      await adminClient.from("user_app_access").delete().eq("user_id", userId);
      // Insert new access
      if (app_access.length > 0) {
        const rows = app_access.map((app_id: string) => ({
          user_id: userId,
          app_id,
          granted_by: caller.id,
        }));
        await adminClient.from("user_app_access").insert(rows);
      }
    }

    const action = existingUser ? "updated" : "created";

    // Audit log
    try {
      await adminClient.from("audit_log").insert({
        user_id: caller.id,
        user_email: caller.email,
        action: "USER_INVITED",
        table_name: "user_roles",
        record_id: userId,
        summary: `User ${email} ${action} with role "${role}" by ${caller.email}`,
        new_data: { email, role, full_name, action, app_access },
      });
    } catch (auditErr) {
      console.error("Audit log insert failed:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: `User ${email} ${action} with role ${role}. They can sign in with Google.${temp_password && !existingUser ? " A fallback password was also set." : ""}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
