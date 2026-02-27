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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = user.email;
    if (!email) {
      return new Response(JSON.stringify({ role: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check for pending role assignment
    const { data: pending } = await adminClient
      .from("pending_role_assignments")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!pending) {
      return new Response(JSON.stringify({ role: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Found pending assignment for", email, "role:", pending.role);

    // Assign the role
    await adminClient.from("user_roles").delete().eq("user_id", user.id);
    await adminClient.from("user_roles").insert({ user_id: user.id, role: pending.role });

    // Update profile
    await adminClient
      .from("profiles")
      .upsert({
        user_id: user.id,
        role: "approved",
        full_name: pending.full_name || user.user_metadata?.full_name || email,
        email,
      }, { onConflict: "user_id" });

    // Copy app access
    if (pending.app_access && pending.app_access.length > 0) {
      await adminClient.from("user_app_access").delete().eq("user_id", user.id);
      const rows = pending.app_access.map((app_id: string) => ({
        user_id: user.id,
        app_id,
        granted_by: pending.invited_by,
      }));
      await adminClient.from("user_app_access").insert(rows);
    }

    // Delete the pending assignment
    await adminClient.from("pending_role_assignments").delete().eq("id", pending.id);

    console.log("Auto-assigned role", pending.role, "to", email);

    return new Response(JSON.stringify({ role: pending.role }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-pending-role error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
