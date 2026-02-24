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

    const { invitationId, baseUrl } = await req.json();

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: "invitationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invitation with employee data
    const { data: invitation, error: fetchErr } = await supabase
      .from("invitations")
      .select(`*, employees (email, first_name, last_name)`)
      .eq("id", invitationId)
      .single();

    if (fetchErr || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employee = invitation.employees as any;
    const recipientEmail = employee?.email;
    const employeeName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") || "Candidate";
    const onboardingLink = `${baseUrl}/onboard/${invitation.token}`;

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Employee has no email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          onboardingLink,
          recipientEmail,
          employeeName,
          message: "Email service not configured. Copy the link below and send it manually.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch company name for the email
    const { data: companies } = await supabase
      .from("companies")
      .select("name")
      .limit(1)
      .single();
    const companyName = companies?.name || "Ljungan Forestry";

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${companyName} HR <hr@mail.erptable.com>`,
        to: [recipientEmail],
        subject: `Onboarding Invitation — ${companyName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1a1a1a; font-size: 22px; margin: 0;">Welcome to ${companyName}</h1>
              <p style="color: #666; font-size: 14px; margin-top: 8px;">Onboarding Invitation</p>
            </div>

            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Dear ${employeeName},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              You have been invited to complete your onboarding with <strong>${companyName}</strong>. 
              Please click the button below to fill in your personal details.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${onboardingLink}" 
                 style="display: inline-block; background-color: #1a1a1a; color: #ffffff; 
                        padding: 14px 32px; text-decoration: none; border-radius: 6px; 
                        font-size: 15px; font-weight: 500;">
                Complete Onboarding
              </a>
            </div>

            <p style="color: #666; font-size: 13px; line-height: 1.5;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${onboardingLink}" style="color: #2563eb; word-break: break-all;">${onboardingLink}</a>
            </p>

            <p style="color: #666; font-size: 13px; line-height: 1.5;">
              This invitation expires on <strong>${new Date(invitation.expires_at).toLocaleDateString("en-GB")}</strong>. 
              If you have any questions, please contact your HR department.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">
              This email was sent from ${companyName}'s HR system. If you did not expect this email, please disregard it.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend error:", errBody);
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          onboardingLink,
          recipientEmail,
          employeeName,
          message: `Email sending failed. Copy the link below and send it manually.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark invitation as SENT
    await supabase
      .from("invitations")
      .update({ status: "SENT" })
      .eq("id", invitationId);

    // Audit log entry
    const callerId = claimsData.claims.sub;
    try {
      const { data: callerUser } = await supabase.auth.admin.getUserById(callerId);
      await supabase.from("audit_log").insert({
        user_id: callerId,
        user_email: callerUser?.user?.email || callerId,
        action: "EMAIL_SENT",
        table_name: "invitations",
        record_id: invitationId,
        summary: `Invitation email sent to ${recipientEmail} (${employeeName})`,
        new_data: { recipient: recipientEmail, employeeName, onboardingLink },
      });
    } catch (auditErr) {
      console.error("Audit log insert failed:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        onboardingLink,
        recipientEmail,
        employeeName,
        message: `Invitation email sent to ${recipientEmail}`,
      }),
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
