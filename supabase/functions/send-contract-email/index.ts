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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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
    const { data: roleCheck } = await authClient.rpc("is_hr_user");
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: HR role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { contractId, recipientEmail } = await req.json();

    if (!contractId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "contractId and recipientEmail are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contract with related data
    const { data: contract, error: fetchErr } = await supabase
      .from("contracts")
      .select(`*, employees (email, first_name, last_name), companies (name, org_number)`)
      .eq("id", contractId)
      .single();

    if (fetchErr || !contract) {
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employee = contract.employees as any;
    const company = contract.companies as any;
    const employeeName = `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() || "Employee";
    const companyName = company?.name || "Employer";
    const contractCode = contract.contract_code || "Draft";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured. Please add the RESEND_API_KEY secret to enable email sending.",
          contractCode,
          employeeName,
          recipientEmail,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Contracts <contracts@mail.erptable.com>",
        to: [recipientEmail],
        subject: `Employment Contract ${contractCode} — ${companyName}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">
              Employment Contract / Anställningsavtal
            </h2>
            <p>Dear ${employeeName},</p>
            <p>Please find attached your signed employment contract <strong>${contractCode}</strong> with <strong>${companyName}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 6px 12px; border: 1px solid #ddd; font-weight: 600; background: #f8f8f8;">Contract ID</td>
                <td style="padding: 6px 12px; border: 1px solid #ddd;">${contractCode}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; border: 1px solid #ddd; font-weight: 600; background: #f8f8f8;">Employee</td>
                <td style="padding: 6px 12px; border: 1px solid #ddd;">${employeeName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; border: 1px solid #ddd; font-weight: 600; background: #f8f8f8;">Employer</td>
                <td style="padding: 6px 12px; border: 1px solid #ddd;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; border: 1px solid #ddd; font-weight: 600; background: #f8f8f8;">Season</td>
                <td style="padding: 6px 12px; border: 1px solid #ddd;">${contract.season_year || "—"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; border: 1px solid #ddd; font-weight: 600; background: #f8f8f8;">Signed</td>
                <td style="padding: 6px 12px; border: 1px solid #ddd;">${contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : "—"}</td>
              </tr>
            </table>
            <p style="color: #666; font-size: 13px;">
              To view the full contract, please log in to the system or contact your HR department.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">
              This email was sent from ${companyName}'s HR system. If you did not expect this email, please contact your employer.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend error:", errBody);
      throw new Error(`Email service error: ${emailResponse.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, contractCode, recipientEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
