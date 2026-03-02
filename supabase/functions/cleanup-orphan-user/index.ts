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

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
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
      return new Response(JSON.stringify({ error: "Only admins can clean up orphan users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cleanup orphan user:", email);

    // Find the auth user
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const orphan = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!orphan) {
      return new Response(JSON.stringify({ error: "No auth user found for this email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preserve role and app_access before deletion
    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", orphan.id)
      .maybeSingle();

    const { data: existingAccess } = await adminClient
      .from("user_app_access")
      .select("app_id")
      .eq("user_id", orphan.id);

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", orphan.id)
      .maybeSingle();

    const role = existingRole?.role || "user";
    const appAccess = existingAccess?.map((a: any) => a.app_id) || [];
    const fullName = existingProfile?.full_name || email;

    // Delete related data first
    await adminClient.from("user_app_access").delete().eq("user_id", orphan.id);
    await adminClient.from("user_roles").delete().eq("user_id", orphan.id);
    await adminClient.from("profiles").delete().eq("user_id", orphan.id);

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(orphan.id);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError.message);
      return new Response(JSON.stringify({ error: "Failed to delete auth user: " + deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pending role assignment so they can sign in fresh
    await adminClient.from("pending_role_assignments").upsert(
      {
        email: email.toLowerCase(),
        role,
        full_name: fullName,
        app_access: appAccess,
        invited_by: caller.id,
      },
      { onConflict: "email" }
    );

    // Audit log
    const { data: callerProfile } = await adminClient.from("profiles").select("current_org_id").eq("user_id", caller.id).maybeSingle();
    await adminClient.from("audit_log").insert({
      user_id: caller.id,
      user_email: caller.email,
      action: "ORPHAN_CLEANUP",
      table_name: "auth.users",
      record_id: orphan.id,
      summary: `Cleaned up orphan auth user ${email} (role: ${role}, ${appAccess.length} apps). Pending assignment created.`,
      org_id: callerProfile?.current_org_id,
    });

    console.log("Orphan cleaned up:", email, "role:", role, "apps:", appAccess.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Orphan user ${email} deleted. Pending assignment created with role "${role}" and ${appAccess.length} app(s). They can now sign in fresh via Google.`,
        preserved: { role, app_access: appAccess, full_name: fullName },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cleanup-orphan-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
