import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, reporter_email, current_page, screenshot_url, org_id } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get super admin emails from DB
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ message: "No admins found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminIds = adminRoles.map((r: any) => r.user_id);
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("email")
      .in("user_id", adminIds);

    const adminEmails = (profiles || []).map((p: any) => p.email).filter(Boolean);
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No admin emails found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const screenshotHtml = screenshot_url
      ? `<p><strong>Screenshot:</strong><br/><a href="${screenshot_url}">View Screenshot</a></p>`
      : "";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🐛 New Issue Report</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Title</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${title}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Reporter</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${reporter_email || "Unknown"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Page</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${current_page || "—"}</td></tr>
        </table>
        <h3 style="margin-top: 16px;">Description</h3>
        <p style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 6px;">${description}</p>
        ${screenshotHtml}
        <hr style="margin-top: 24px;" />
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from ERP Table Issue Reporter.</p>
      </div>
    `;

    const textBody = `New Issue Report\n\nTitle: ${title}\nReporter: ${reporter_email || "Unknown"}\nPage: ${current_page || "—"}\n\nDescription:\n${description}\n\n${screenshot_url ? "Screenshot: " + screenshot_url : ""}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ERP Table Issues <issues@mail.erptable.com>",
        to: adminEmails,
        subject: `🐛 Issue Report: ${title}`,
        html: htmlBody,
        text: textBody,
        headers: {
          "X-Entity-Ref-ID": `issue-${Date.now()}`,
        },
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-issue-notification error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
