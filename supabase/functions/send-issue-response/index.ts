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
    const { issue_id, reporter_email, responder_email, comment_body } = await req.json();

    if (!reporter_email || !comment_body) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch issue title for context
    let issueTitle = "your reported issue";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data } = await supabase
        .from("issue_reports")
        .select("title")
        .eq("id", issue_id)
        .single();
      if (data?.title) issueTitle = data.title;
    } catch (_) {
      // fallback to generic title
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New Response on Your Issue Report</h2>
        <p>There is a new response on your issue: <strong>${issueTitle}</strong></p>
        <div style="background: #f5f5f5; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; white-space: pre-wrap;">${comment_body}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Response from: ${responder_email || "Admin"}</p>
        <p style="color: #999; font-size: 12px;">You can view the full thread and reply by opening your "My Issues" panel in the application.</p>
      </div>
    `;

    const textBody = `New response on your issue "${issueTitle}":\n\n${comment_body}\n\nFrom: ${responder_email || "Admin"}\n\nView the full thread in your "My Issues" panel.`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ERP Table <no-reply@erptable.lovable.app>",
        to: [reporter_email],
        subject: `Response on your issue: ${issueTitle}`,
        html: htmlBody,
        text: textBody,
        reply_to: responder_email || undefined,
        headers: {
          "X-Entity-Ref-ID": `issue-response-${issue_id}-${Date.now()}`,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-issue-response error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
