import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLISHED_DOMAIN = "https://erptable.lovable.app";

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

    // --- Use service role for data operations ---
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { contractId } = await req.json();

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

    // Get employee & company info
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

    // Build signing URL using published domain
    const fullSigningUrl = `${PUBLISHED_DOMAIN}/sign/${signingToken}`;

    // Attempt to send email via Resend
    let emailSent = false;
    if (resendApiKey && employeeEmail) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Ljungan Forestry <contracts@mail.erptable.com>",
            to: [employeeEmail],
            subject: `Employment Contract Ready for Signing – ${companyName}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #1a1a1a; margin: 0;">Employment Contract</h2>
                  <p style="color: #666; font-size: 14px; margin: 4px 0 0;">Anställningsavtal</p>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px; color: #333;">
                    Dear <strong>${employeeName || "Employee"}</strong>,
                  </p>
                  <p style="margin: 0 0 8px; color: #333; font-size: 14px;">
                    Your employment contract${contractCode ? ` (${contractCode})` : ""} with <strong>${companyName}</strong> is ready for your review and signature.
                  </p>
                  <p style="margin: 0; color: #666; font-size: 13px; font-style: italic;">
                    Ditt anställningsavtal${contractCode ? ` (${contractCode})` : ""} hos ${companyName} är redo för granskning och signering.
                  </p>
                </div>

                <p style="color: #333; font-size: 14px; margin-bottom: 8px;">
                  Please click the button below to review and sign your contract:
                </p>
                <p style="color: #666; font-size: 13px; font-style: italic; margin-bottom: 20px;">
                  Klicka på knappen nedan för att granska och signera ditt avtal:
                </p>

                <div style="text-align: center; margin: 24px 0;">
                  <a href="${fullSigningUrl}" 
                     style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    Review & Sign Contract / Granska & Signera Avtal
                  </a>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
                  <p style="color: #999; font-size: 12px; margin: 0 0 4px;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color: #666; font-size: 12px; word-break: break-all; margin: 0;">
                    ${fullSigningUrl}
                  </p>
                </div>

                <div style="margin-top: 24px; padding: 12px; background: #fffbeb; border-radius: 6px; border: 1px solid #fde68a;">
                  <p style="color: #92400e; font-size: 12px; margin: 0;">
                    ⚠️ This link is personal and should not be shared. / Denna länk är personlig och bör inte delas.
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (emailRes.ok) {
          emailSent = true;
          console.log("Signing email sent successfully to", employeeEmail);
        } else {
          const errBody = await emailRes.text();
          console.error("Resend error:", emailRes.status, errBody);
        }
      } catch (emailErr) {
        console.error("Failed to send email via Resend:", emailErr);
      }
    } else {
      console.log("Resend not configured or no employee email — skipping email delivery");
    }

    // Audit log entry
    const callerId = claimsData.claims.sub;
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", callerId)
      .maybeSingle();
    const callerEmail = callerProfile?.full_name || callerId;
    
    try {
      await supabase.from("audit_log").insert({
        user_id: callerId,
        user_email: callerEmail,
        action: "SIGNING_EMAIL_SENT",
        table_name: "contracts",
        record_id: contractId,
        summary: `Signing email ${emailSent ? "sent" : "attempted"} for contract ${contractCode || "—"} to ${employeeEmail || "unknown"}`,
        new_data: { recipient: employeeEmail, contractCode, emailSent, signingUrl: fullSigningUrl },
      });
    } catch (auditErr) {
      console.error("Audit log insert failed:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
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
