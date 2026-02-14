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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    const baseUrl = signingUrl || supabaseUrl.replace("supabase.co", "lovable.app");
    const fullSigningUrl = `${signingUrl}/sign/${signingToken}`;

    // Send email using Supabase's built-in email (via auth admin)
    // For now, we'll return the signing URL so the frontend can handle it
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
