import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  org_admin: "Admin",
  user: "Standard User",
  team_leader: "Team Leader",
  hr_manager: "HR Manager",
  project_manager: "Project Manager",
  payroll_manager: "Payroll Manager",
};

function buildEmailHtml(userName: string, roleName: string, loginUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a1a1a; font-size: 22px; margin: 0;">Your Account Has Been Approved</h1>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">You now have access to the system</p>
      </div>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Hi ${userName},
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Great news! Your account has been approved and you have been assigned the role of <strong>${roleName}</strong>. You can now sign in and start using the system.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" 
           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; 
                  padding: 14px 32px; text-decoration: none; border-radius: 6px; 
                  font-size: 15px; font-weight: 500;">
          Sign In Now
        </a>
      </div>

      <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #333; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">How to sign in:</p>
        <ul style="color: #555; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
          <li><strong>Google account?</strong> Click "Sign in with Google" — it's the fastest option.</li>
          <li><strong>Other email (iCloud, Outlook, etc.)?</strong> Click "Use email &amp; password instead", then click <strong>"Forgot password?"</strong> to set your own password.</li>
        </ul>
      </div>

      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${loginUrl}" style="color: #2563eb; word-break: break-all;">${loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        This is an automated notification from ERP Table HR. If you did not expect this email, please disregard it.
      </p>
    </div>
  `;
}

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only admins can send notifications" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, userName, role, loginUrl } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "email and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ success: false, message: "Email service not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roleName = ROLE_LABELS[role] || role;
    const html = buildEmailHtml(userName || email, roleName, loginUrl || supabaseUrl);

    const displayName = userName || email;
    const plainText = `Hi ${displayName},\n\nGreat news! Your account has been approved and you have been assigned the role of ${roleName}. You can now sign in and start using the system.\n\nSign in here: ${loginUrl || supabaseUrl}\n\nThis is an automated notification from ERP Table HR. If you did not expect this email, please disregard it.`;

    const resend = new Resend(resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: "ERP Table HR <hr@mail.erptable.com>",
      reply_to: "hr@mail.erptable.com",
      to: [email],
      subject: `${displayName} — Your ERP Table Account Is Ready`,
      html,
      text: plainText,
      headers: {
        "X-Entity-Ref-ID": `role-approval-${Date.now()}`,
      },
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return new Response(JSON.stringify({ success: false, message: sendError.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log
    try {
      await adminClient.from("audit_log").insert({
        user_id: caller.id,
        user_email: caller.email,
        action: "ROLE_NOTIFICATION_SENT",
        table_name: "user_roles",
        record_id: email,
        summary: `Role approval notification sent to ${email} (${roleName}) by ${caller.email}`,
        new_data: { email, role, userName },
      });
    } catch (e) {
      console.error("Audit log failed:", e);
    }

    return new Response(JSON.stringify({ success: true, message: `Notification sent to ${email}` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
