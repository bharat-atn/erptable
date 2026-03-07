import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return val; }
}

function esc(v: any): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a two-column row for the email table */
function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0;font-family:'Arial',sans-serif;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#666;width:35%;vertical-align:top;">${label}</td>
    <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0;font-size:9.5pt;color:#111;">${value}</td>
  </tr>`;
}

function sectionHeader(title: string): string {
  return `<tr><td colspan="2" style="padding:12px 0 4px 0;font-family:'Arial',sans-serif;font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border-bottom:2px solid #333;color:#1a1a1a;">${title}</td></tr>`;
}

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
      .select(`*, employees (email, first_name, last_name, middle_name, phone), companies (name, org_number, address, postcode, city)`)
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
    const fd = (contract.form_data as Record<string, any>) || {};
    const employeeName = `${fd.firstName || employee?.first_name || ""} ${fd.lastName || employee?.last_name || ""}`.trim() || "Employee";
    const companyName = company?.name || fd.companySnapshot?.name || "Employer";
    const companyOrgNumber = company?.org_number || fd.companySnapshot?.orgNumber || "";
    const companyAddress = company?.address || fd.companySnapshot?.address || "";
    const companyPostcode = company?.postcode || fd.companySnapshot?.postcode || "";
    const companyCity = company?.city || fd.companySnapshot?.city || "";
    const contractCode = contract.contract_code || "Draft";
    const seasonYear = contract.season_year || "";
    const signingToken = contract.signing_token || "";

    const empSignMeta = (contract.employee_signing_metadata as any) || {};
    const emplrSignMeta = (contract.employer_signing_metadata as any) || {};

    // Employment form mapping
    const efLabels: Record<string, string> = {
      permanent: "Permanent / Tillsvidareanställning",
      probation: "Probation / Provanställning",
      "fixed-term": "Fixed-term / Tidsbegränsad",
      "temp-replacement": "Temp replacement / Vikariat",
      seasonal: "Seasonal / Säsongsanställning",
      "age-69": "Age 69+ / Ålder 69+",
    };
    const efLabel = efLabels[fd.employmentForm] || fd.employmentForm || "—";

    // Get employment dates based on type
    let empFromDate = "—";
    let empToDate = "—";
    switch (fd.employmentForm) {
      case "permanent": empFromDate = fmtDate(fd.permanentFromDate); break;
      case "probation": empFromDate = fmtDate(fd.probationFromDate); empToDate = fmtDate(fd.probationUntilDate); break;
      case "fixed-term": empFromDate = fmtDate(fd.fixedTermFromDate); empToDate = fmtDate(fd.fixedTermUntilDate); break;
      case "temp-replacement": empFromDate = fmtDate(fd.tempReplacementFromDate); break;
      case "seasonal": empFromDate = fmtDate(fd.seasonalFromDate); empToDate = fmtDate(fd.seasonalEndAround); break;
      case "age-69": empFromDate = fmtDate(fd.age69FromDate); empToDate = fmtDate(fd.age69UntilDate); break;
    }

    // Salary info
    const salaryType = fd.salaryType === "hourly" ? "Hourly / Timlön" : fd.salaryType === "monthly" ? "Monthly / Månadslön" : fd.salaryType || "—";
    let salaryAmount = "—";
    if (fd.salaryType === "hourly") {
      salaryAmount = fd.hourlyBasic ? `${fd.hourlyBasic} SEK/h` : "—";
      if (fd.hourlyPremium) salaryAmount += ` (+ ${fd.hourlyPremium} SEK premium)`;
    } else if (fd.salaryType === "monthly") {
      salaryAmount = fd.monthlyBasic ? `${fd.monthlyBasic} SEK/month` : "—";
      if (fd.monthlyPremium) salaryAmount += ` (+ ${fd.monthlyPremium} SEK premium)`;
    }

    // Working time
    let workingTime = "Full-time / Heltid";
    if (fd.workingTime === "part-time") {
      workingTime = `Part-time / Deltid ${fd.partTimePercent ? `(${fd.partTimePercent}%)` : ""}`;
    }

    // Build the base URL for contract link
    const baseUrl = supabaseUrl.replace(".supabase.co", "").replace("https://", "");
    // Use the published app URL pattern
    const appOrigin = req.headers.get("origin") || "https://erptable.lovable.app";

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

    // Build comprehensive email HTML
    const viewLink = signingToken ? `${appOrigin}/sign/${signingToken}` : "";

    const emailHtml = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff;">
  <!-- Header -->
  <div style="text-align:center;padding-bottom:10px;border-bottom:3px double #333;margin-bottom:16px;">
    <h1 style="font-family:'Arial',sans-serif;font-size:14pt;font-weight:700;letter-spacing:2.5px;margin:0 0 4px 0;color:#1a1a1a;">EMPLOYMENT CONTRACT / ANSTÄLLNINGSAVTAL</h1>
    <p style="font-size:9pt;color:#555;letter-spacing:0.5px;margin:0;">${esc(contractCode)} · Season / Säsong: ${esc(seasonYear)}</p>
  </div>

  <table style="width:100%;border-collapse:collapse;font-family:Georgia,'Times New Roman',serif;">
    <!-- §1 EMPLOYER -->
    ${sectionHeader("§1. Employer / Arbetsgivare")}
    ${row("Company / Företag", esc(companyName))}
    ${row("Org. number / Org.nr", esc(companyOrgNumber))}
    ${row("Address / Adress", esc(companyAddress))}
    ${row("Postcode & City", `${esc(companyPostcode)} ${esc(companyCity)}`.trim())}

    <!-- §2 EMPLOYEE -->
    ${sectionHeader("§2. Employee / Arbetstagare")}
    ${row("Name / Namn", esc(employeeName))}
    ${fd.middleName ? row("Middle name / Mellannamn", esc(fd.middleName)) : ""}
    ${row("Date of birth / Födelsedatum", fmtDate(fd.birthday))}
    ${row("Citizenship / Medborgarskap", esc(fd.citizenship))}
    ${row("Address / Adress", esc(fd.address))}
    ${row("City / Ort", esc(fd.city))}
    ${row("Postcode / Postnr", esc(fd.zipCode))}
    ${row("Country / Land", esc(fd.country))}
    ${row("Phone / Telefon", esc(fd.mobile))}
    ${row("Email / E-post", esc(fd.email))}

    <!-- §3 POSITION -->
    ${sectionHeader("§3. Position & Duties / Befattning")}
    ${row("Main duties / Arbetsuppgifter", esc(fd.mainDuties))}
    ${row("Job type / Befattning", esc(fd.jobType))}
    ${row("Experience / Erfarenhet", esc(fd.experienceLevel))}
    ${row("Workplace / Arbetsplats", esc(fd.mainWorkplace || fd.postingLocation))}

    <!-- §4 EMPLOYMENT FORM -->
    ${sectionHeader("§4. Employment Form / Anställningsform")}
    ${row("Form / Typ", esc(efLabel))}
    ${row("From / Från", empFromDate)}
    ${empToDate !== "—" ? row("To / Till", empToDate) : ""}

    <!-- §5 WORKING TIME -->
    ${sectionHeader("§5. Working Time / Arbetstid")}
    ${row("Working time / Arbetstid", esc(workingTime))}
    ${fd.annualLeaveDays ? row("Annual leave / Semester", `${esc(fd.annualLeaveDays)} days / dagar`) : ""}

    <!-- §7 COMPENSATION -->
    ${sectionHeader("§7. Compensation / Ersättning")}
    ${row("Salary type / Lönetyp", esc(salaryType))}
    ${row("Amount / Belopp", esc(salaryAmount))}
    ${fd.companyPremiumPercent && Number(fd.companyPremiumPercent) > 0 ? row("Company premium / Företagspremie", `+${esc(fd.companyPremiumPercent)}%`) : ""}

    <!-- §8 SALARY DETAILS -->
    ${sectionHeader("§8. Salary Details / Lönedetaljer")}
    ${row("Piece-work pay", esc(fd.pieceWorkPay))}
    ${row("Other benefits", esc(fd.otherSalaryBenefits))}
    ${fd.paymentMethod ? row("Payment method", fd.paymentMethod === "account" ? "Bank account / Bankkonto" : fd.paymentMethod === "cash" ? "Cash / Kontant" : esc(fd.paymentMethod)) : ""}

    <!-- SIGNING STATUS -->
    ${sectionHeader("Signing / Undertecknande")}
    ${contract.employee_signed_at ? row("Employee signed / Arbetstagare", `${fmtDate(contract.employee_signed_at)}${empSignMeta.place ? ` — ${esc(empSignMeta.place)}` : ""}`) : row("Employee signed", "Not yet signed")}
    ${contract.employer_signed_at ? row("Employer signed / Arbetsgivare", `${fmtDate(contract.employer_signed_at)}${emplrSignMeta.place ? ` — ${esc(emplrSignMeta.place)}` : ""}`) : row("Employer signed", "Not yet signed")}
  </table>

  ${viewLink ? `
  <div style="text-align:center;margin:24px 0 16px;">
    <a href="${viewLink}" style="display:inline-block;padding:10px 28px;background:#1a1a1a;color:#fff;text-decoration:none;font-family:'Arial',sans-serif;font-size:10pt;font-weight:700;letter-spacing:0.5px;border-radius:2px;">VIEW FULL CONTRACT</a>
  </div>
  ` : ""}

  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
  <p style="font-size:8pt;color:#999;text-align:center;">
    This email was sent from ${esc(companyName)}'s HR system.<br/>
    To view the complete contract document with all legal clauses, signatures, and appendices, please use the link above or contact your HR department.
  </p>
</div>`;

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
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend error:", errBody);
      throw new Error(`Email service error: ${emailResponse.status}`);
    }

    // Audit log entry
    const callerId = claimsData.claims.sub;
    try {
      const { data: callerUser } = await supabase.auth.admin.getUserById(callerId);
      await supabase.from("audit_log").insert({
        user_id: callerId,
        user_email: callerUser?.user?.email || callerId,
        action: "CONTRACT_EMAIL_SENT",
        table_name: "contracts",
        record_id: contractId,
        summary: `Signed contract email sent for ${contractCode} to ${recipientEmail}`,
        new_data: { recipient: recipientEmail, contractCode, employeeName },
        org_id: contract.org_id,
      });
    } catch (auditErr) {
      console.error("Audit log insert failed:", auditErr);
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
