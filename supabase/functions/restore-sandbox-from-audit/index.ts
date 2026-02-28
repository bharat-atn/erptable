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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin } = await userClient.rpc("is_super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sandboxOrgId } = await req.json();
    if (!sandboxOrgId) {
      return new Response(JSON.stringify({ error: "sandboxOrgId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch audit log entries for the sandbox org where action is DELETE
    const { data: auditEntries, error: auditErr } = await admin
      .from("audit_log")
      .select("*")
      .eq("org_id", sandboxOrgId)
      .eq("action", "DELETE")
      .order("created_at", { ascending: true });

    if (auditErr) throw auditErr;

    const restored = { employees: 0, invitations: 0, contracts: 0 };
    const skipped: string[] = [];

    for (const entry of auditEntries || []) {
      const oldData = entry.old_data as Record<string, any> | null;
      if (!oldData || !oldData.id) {
        skipped.push(`${entry.table_name}/${entry.record_id}: no old_data`);
        continue;
      }

      // Ensure org_id matches sandbox
      oldData.org_id = sandboxOrgId;

      if (entry.table_name === "employees") {
        // Check if already exists
        const { data: existing } = await admin
          .from("employees")
          .select("id")
          .eq("id", oldData.id)
          .maybeSingle();
        if (existing) {
          skipped.push(`employees/${oldData.id}: already exists`);
          continue;
        }
        const { error } = await admin.from("employees").insert(oldData);
        if (error) {
          skipped.push(`employees/${oldData.id}: ${error.message}`);
        } else {
          restored.employees++;
        }
      } else if (entry.table_name === "invitations") {
        const { data: existing } = await admin
          .from("invitations")
          .select("id")
          .eq("id", oldData.id)
          .maybeSingle();
        if (existing) {
          skipped.push(`invitations/${oldData.id}: already exists`);
          continue;
        }
        // Check if referenced employee exists
        if (oldData.employee_id) {
          const { data: emp } = await admin
            .from("employees")
            .select("id")
            .eq("id", oldData.employee_id)
            .maybeSingle();
          if (!emp) {
            skipped.push(`invitations/${oldData.id}: employee ${oldData.employee_id} missing`);
            continue;
          }
        }
        const { error } = await admin.from("invitations").insert(oldData);
        if (error) {
          skipped.push(`invitations/${oldData.id}: ${error.message}`);
        } else {
          restored.invitations++;
        }
      } else if (entry.table_name === "contracts") {
        const { data: existing } = await admin
          .from("contracts")
          .select("id")
          .eq("id", oldData.id)
          .maybeSingle();
        if (existing) {
          skipped.push(`contracts/${oldData.id}: already exists`);
          continue;
        }
        if (oldData.employee_id) {
          const { data: emp } = await admin
            .from("employees")
            .select("id")
            .eq("id", oldData.employee_id)
            .maybeSingle();
          if (!emp) {
            skipped.push(`contracts/${oldData.id}: employee ${oldData.employee_id} missing`);
            continue;
          }
        }
        const { error } = await admin.from("contracts").insert(oldData);
        if (error) {
          skipped.push(`contracts/${oldData.id}: ${error.message}`);
        } else {
          restored.contracts++;
        }
      }
    }

    return new Response(
      JSON.stringify({ restored, skipped, totalAuditEntries: auditEntries?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
