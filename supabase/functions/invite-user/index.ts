import { createClient } from "npm:@supabase/supabase-js@2";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json();
    const { email, full_name, role, temp_password, app_access } = body;

    console.log("Invite user request:", { email, role, full_name });

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Email and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    
    if (callerError || !caller) {
      console.error("Caller auth failed:", callerError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Caller:", caller.email);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      console.error("Caller is not admin:", caller.email);
      return new Response(JSON.stringify({ error: "Only admins can invite users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    let action: string;

    if (existingUser) {
      // ── Existing auth user: update role directly ──
      userId = existingUser.id;
      console.log("Existing user found:", userId);

      await adminClient.from("user_roles").delete().eq("user_id", userId);
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (roleError) {
        console.error("Role insert failed:", roleError.message);
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile to approved
      await adminClient
        .from("profiles")
        .update({ role: "approved", full_name: full_name || email, email })
        .eq("user_id", userId);

      // Handle app access
      if (Array.isArray(app_access)) {
        await adminClient.from("user_app_access").delete().eq("user_id", userId);
        if (app_access.length > 0) {
          const rows = app_access.map((app_id: string) => ({
            user_id: userId,
            app_id,
            granted_by: caller.id,
          }));
          await adminClient.from("user_app_access").insert(rows);
        }
      }

      // Remove any pending assignment for this email
      await adminClient.from("pending_role_assignments").delete().eq("email", email.toLowerCase());

      action = "updated";

    } else if (temp_password) {
      // ── New user WITH fallback password: create auth user ──
      const password = temp_password;
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });

      if (createError || !newUser) {
        console.error("User creation failed:", createError?.message);
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
      console.log("New user created with password:", userId);

      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.from("user_roles").insert({ user_id: userId, role });
      await adminClient
        .from("profiles")
        .update({ role: "approved", full_name: full_name || email, email })
        .eq("user_id", userId);

      if (Array.isArray(app_access)) {
        await adminClient.from("user_app_access").delete().eq("user_id", userId);
        if (app_access.length > 0) {
          const rows = app_access.map((app_id: string) => ({
            user_id: userId,
            app_id,
            granted_by: caller.id,
          }));
          await adminClient.from("user_app_access").insert(rows);
        }
      }

      action = "created";

    } else {
      // ── New user, NO password: store pending assignment ──
      // When they sign in via Google (or any method), handle_new_user trigger auto-assigns role
      const { error: pendingError } = await adminClient
        .from("pending_role_assignments")
        .upsert(
          {
            email: email.toLowerCase(),
            role,
            full_name: full_name || email,
            app_access: Array.isArray(app_access) ? app_access : [],
            invited_by: caller.id,
          },
          { onConflict: "email" }
        );

      if (pendingError) {
        console.error("Pending assignment failed:", pendingError.message);
        return new Response(JSON.stringify({ error: pendingError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = "pending";
      action = "invited";
      console.log("Pending role assignment stored for:", email);
    }

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

    console.log("Invite success:", email, action);

    const message = action === "invited"
      ? `Invitation stored for ${email} (role: ${role}). They will be auto-approved when they first sign in.`
      : `User ${email} ${action} with role ${role}.${temp_password && action === "created" ? " A fallback password was also set." : ""}`;

    return new Response(
      JSON.stringify({ success: true, user_id: userId, message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
