import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Auth check: require authenticated HR user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Check HR role
    const { data: roleCheck } = await authClient.rpc("is_hr_user");
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: HR role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Use service role for data operations ---
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { contractId, signingUrl } = await req.json();

    if (!contractId) {
      return new Response(JSON.stringify({ error: "contractId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signing token
    const signingToken = crypto.randomUUID() + crypto.randomUUID();

    // Update contract with token and status
    const { error: updateErr } = await supabase
      .from("contracts")
      .update({
        signing_token: signingToken,
        signing_status: "sent_to_employee",
        sent_for_signing_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateErr) throw updateErr;

    // Get employee email
    const { data: contract } = await supabase
      .from("contracts")
      .select("employee_id, contract_code, employees(email, first_name, last_name), companies(name)")
      .eq("id", contractId)
      .single();

    if (!contract) throw new Error("Contract not found");

    const employee = (contract as any).employees;
    const company = (contract as any).companies;
    const employeeEmail = employee?.email;
    const employeeName = `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();
    const companyName = company?.name || "Employer";
    const contractCode = contract.contract_code;

    // Build signing URL
    const fullSigningUrl = `${signingUrl}/sign/${signingToken}`;

    return new Response(
      JSON.stringify({
        success: true,
        signingToken,
        signingUrl: fullSigningUrl,
        employeeEmail,
        employeeName,
        companyName,
        contractCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
