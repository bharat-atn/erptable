import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

function getTranslations(lang: string) {
  switch (lang) {
    case "sv": return [translations.sv];
    case "en": return [translations.en];
    case "en_sv": return [translations.en, translations.sv];
    case "ro_en": return [translations.ro, translations.en];
    case "th_en": return [translations.th, translations.en];
    case "uk_en": return [translations.uk, translations.en];
    default: return [translations.en];
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

interface EmailPreviewPanelProps {
  language: string;
  recipientName: string;
  recipientEmail: string;
}

export function EmailPreviewPanel({ language, recipientName, recipientEmail }: EmailPreviewPanelProps) {
  const { data: company } = useQuery({
    queryKey: ["company-for-preview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name")
        .limit(1)
        .single();
      return data?.name || "Ljungan Forestry";
    },
    staleTime: 60_000,
  });

  const companyName = company || "Ljungan Forestry";
  const name = recipientName || "Candidate";
  const sampleLink = "https://erptable.lovable.app/onboard/example-token";
  const expiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB");

  const langs = getTranslations(language);
  const subject = langs[0].subject(companyName);

  const html = useMemo(
    () => buildEmailHtml(langs, companyName, name, sampleLink, expiresDate),
    [language, companyName, name]
  );

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/30 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">To:</span> {recipientEmail || "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">From:</span> {companyName} HR &lt;hr@mail.erptable.com&gt;
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Subject:</span> {subject}
        </p>
      </div>
      <div
        className="rounded-md border bg-white p-0 overflow-auto max-h-[400px]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
