import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Translations keyed by invitation language code ---
const translations: Record<string, {
  subject: (company: string) => string;
  welcome: (company: string) => string;
  subtitle: string;
  greeting: (name: string) => string;
  body: (company: string) => string;
  button: string;
  fallbackLink: string;
  expires: (date: string) => string;
  footer: (company: string) => string;
}> = {
  en: {
    subject: (c) => `Onboarding Invitation — ${c}`,
    welcome: (c) => `Welcome to ${c}`,
    subtitle: "Onboarding Invitation",
    greeting: (n) => `Dear ${n},`,
    body: (c) => `You have been invited to complete your onboarding with <strong>${c}</strong>. Please click the button below to fill in your personal details.`,
    button: "Complete Onboarding",
    fallbackLink: "If the button doesn't work, copy and paste this link into your browser:",
    expires: (d) => `This invitation expires on <strong>${d}</strong>. If you have any questions, please contact your HR department.`,
    footer: (c) => `This email was sent from ${c}'s HR system. If you did not expect this email, please disregard it.`,
  },
  sv: {
    subject: (c) => `Inbjudan till onboarding — ${c}`,
    welcome: (c) => `Välkommen till ${c}`,
    subtitle: "Inbjudan till onboarding",
    greeting: (n) => `Hej ${n},`,
    body: (c) => `Du har blivit inbjuden att slutföra din onboarding hos <strong>${c}</strong>. Klicka på knappen nedan för att fylla i dina personuppgifter.`,
    button: "Slutför onboarding",
    fallbackLink: "Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:",
    expires: (d) => `Denna inbjudan går ut <strong>${d}</strong>. Om du har frågor, vänligen kontakta din HR-avdelning.`,
    footer: (c) => `Detta e-postmeddelande skickades från ${c}:s HR-system. Om du inte förväntade dig detta e-postmeddelande, vänligen ignorera det.`,
  },
  ro: {
    subject: (c) => `Invitație de onboarding — ${c}`,
    welcome: (c) => `Bine ați venit la ${c}`,
    subtitle: "Invitație de onboarding",
    greeting: (n) => `Dragă ${n},`,
    body: (c) => `Ați fost invitat(ă) să vă completați procesul de onboarding la <strong>${c}</strong>. Vă rugăm să apăsați butonul de mai jos pentru a vă completa datele personale.`,
    button: "Completați onboardingul",
    fallbackLink: "Dacă butonul nu funcționează, copiați și lipiți acest link în browser:",
    expires: (d) => `Această invitație expiră pe <strong>${d}</strong>. Dacă aveți întrebări, vă rugăm să contactați departamentul HR.`,
    footer: (c) => `Acest e-mail a fost trimis de sistemul HR al ${c}. Dacă nu așteptați acest e-mail, vă rugăm să îl ignorați.`,
  },
  th: {
    subject: (c) => `คำเชิญเข้าร่วมงาน — ${c}`,
    welcome: (c) => `ยินดีต้อนรับสู่ ${c}`,
    subtitle: "คำเชิญเข้าร่วมงาน",
    greeting: (n) => `เรียน ${n},`,
    body: (c) => `คุณได้รับเชิญให้ดำเนินการลงทะเบียนเข้าร่วมงานกับ <strong>${c}</strong> กรุณาคลิกปุ่มด้านล่างเพื่อกรอกข้อมูลส่วนตัวของคุณ`,
    button: "ดำเนินการลงทะเบียน",
    fallbackLink: "หากปุ่มไม่ทำงาน กรุณาคัดลอกและวางลิงก์นี้ในเบราว์เซอร์ของคุณ:",
    expires: (d) => `คำเชิญนี้จะหมดอายุในวันที่ <strong>${d}</strong> หากมีคำถามใด ๆ กรุณาติดต่อฝ่ายทรัพยากรบุคคล`,
    footer: (c) => `อีเมลนี้ส่งจากระบบ HR ของ ${c} หากคุณไม่ได้คาดหวังอีเมลนี้ กรุณาเพิกเฉย`,
  },
  uk: {
    subject: (c: string) => `Запрошення на реєстрацію — ${c}`,
    welcome: (c: string) => `Ласкаво просимо до ${c}`,
    subtitle: "Запрошення на реєстрацію",
    greeting: (n: string) => `Шановний(-а) ${n},`,
    body: (c: string) => `Вас запрошено пройти реєстрацію в <strong>${c}</strong>. Будь ласка, натисніть кнопку нижче, щоб заповнити ваші особисті дані.`,
    button: "Пройти реєстрацію",
    fallbackLink: "Якщо кнопка не працює, скопіюйте та вставте це посилання у браузер:",
    expires: (d: string) => `Це запрошення дійсне до <strong>${d}</strong>. Якщо у вас є запитання, зверніться до відділу кадрів.`,
    footer: (c: string) => `Цей лист надіслано з HR-системи ${c}. Якщо ви не очікували цього листа, проігноруйте його.`,
  },
};

// Map language codes to primary + secondary translations
function getTranslations(lang: string) {
  switch (lang) {
    case "sv":
      return [translations.sv];
    case "en":
      return [translations.en];
    case "en_sv":
      return [translations.en, translations.sv];
    case "ro_en":
      return [translations.ro, translations.en];
    case "th_en":
      return [translations.th, translations.en];
    case "uk_en":
      return [translations.uk, translations.en];
    default:
      return [translations.en];
  }
}

function buildEmailHtml(
  langs: ReturnType<typeof getTranslations>,
  companyName: string,
  employeeName: string,
  onboardingLink: string,
  expiresDate: string,
) {
  const primary = langs[0];
  const secondary = langs[1];

  const dual = (fn: keyof typeof primary, ...args: any[]) => {
    const pVal = typeof primary[fn] === "function" ? (primary[fn] as any)(...args) : primary[fn];
    if (!secondary) return pVal;
    const sVal = typeof secondary[fn] === "function" ? (secondary[fn] as any)(...args) : secondary[fn];
    return `${pVal}<br/><span style="color:#888; font-size:13px;">${sVal}</span>`;
  };

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a1a1a; font-size: 22px; margin: 0;">${dual("welcome", companyName)}</h1>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">${dual("subtitle")}</p>
      </div>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        ${dual("greeting", employeeName)}
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        ${dual("body", companyName)}
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${onboardingLink}" 
           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; 
                  padding: 14px 32px; text-decoration: none; border-radius: 6px; 
                  font-size: 15px; font-weight: 500;">
          ${dual("button")}
        </a>
      </div>

      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        ${dual("fallbackLink")}<br/>
        <a href="${onboardingLink}" style="color: #2563eb; word-break: break-all;">${onboardingLink}</a>
      </p>

      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        ${dual("expires", expiresDate)}
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        ${dual("footer", companyName)}
      </p>
    </div>
  `;
}

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
    const invitationLanguage = invitation.language || "en_sv";

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Employee has no email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch company name for the email
    const { data: companies } = await supabase
      .from("companies")
      .select("name")
      .limit(1)
      .single();
    const companyName = companies?.name || "Ljungan Forestry";

    // Get translations for this invitation's language
    const langs = getTranslations(invitationLanguage);
    const expiresDate = new Date(invitation.expires_at).toLocaleDateString(
      invitationLanguage.startsWith("sv") ? "sv-SE" : invitationLanguage.startsWith("ro") ? "ro-RO" : invitationLanguage.startsWith("th") ? "th-TH" : "en-GB"
    );
    const subject = langs[0].subject(companyName);
    const emailHtml = buildEmailHtml(langs, companyName, employeeName, onboardingLink, expiresDate);

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
        subject,
        html: emailHtml,
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
        summary: `Invitation email sent to ${recipientEmail} (${employeeName}) in ${invitationLanguage}`,
        new_data: { recipient: recipientEmail, employeeName, onboardingLink, language: invitationLanguage },
        org_id: invitation.org_id,
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
