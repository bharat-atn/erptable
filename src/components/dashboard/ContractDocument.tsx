import { forwardRef } from "react";
import { format } from "date-fns";

interface ContractDocumentProps {
  companyName: string;
  companyOrgNumber?: string | null;
  companyAddress?: string | null;
  companyPostcode?: string | null;
  companyCity?: string | null;
  contractCode?: string | null;
  seasonYear?: string | null;
  formData: Record<string, any>;
  employeeSignatureUrl?: string | null;
  employerSignatureUrl?: string | null;
  employeeSignedAt?: string | null;
  employerSignedAt?: string | null;
}

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  try {
    return format(new Date(val), "yyyy-MM-dd");
  } catch {
    return val;
  }
}

function Field({ label, labelSv, value }: { label: string; labelSv: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500">
        {label} / {labelSv}
      </p>
      <p className="text-sm print:text-xs">{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ number, titleEn, titleSv }: { number: string; titleEn: string; titleSv: string }) {
  return (
    <div className="border-b-2 border-foreground/20 pb-1 mt-6 mb-3 print:mt-4 print:mb-2 print:border-gray-300">
      <h3 className="text-sm font-bold uppercase tracking-wide print:text-xs">
        §{number}. {titleEn} / {titleSv}
      </h3>
    </div>
  );
}

export const ContractDocument = forwardRef<HTMLDivElement, ContractDocumentProps>(
  function ContractDocument(
    {
      companyName,
      companyOrgNumber,
      companyAddress,
      companyPostcode,
      companyCity,
      contractCode,
      seasonYear,
      formData: fd,
      employeeSignatureUrl,
      employerSignatureUrl,
      employeeSignedAt,
      employerSignedAt,
    },
    ref
  ) {
    const employmentFormLabels: Record<string, string> = {
      permanent: "Permanent / Tillsvidareanställning",
      probation: "Probationary / Provanställning",
      "fixed-term": "Fixed-term / Tidsbegränsad anställning",
      "temp-replacement": "Temporary replacement / Vikariat",
      seasonal: "Seasonal / Säsongsanställning",
      "age-69": "Age 69+ / Anställning efter 69 år",
    };

    const salaryTypeLabels: Record<string, string> = {
      hourly: "Hourly / Timlön",
      monthly: "Monthly / Månadslön",
    };

    return (
      <div
        ref={ref}
        className="bg-background text-foreground print:bg-white print:text-black max-w-[210mm] mx-auto p-8 print:p-[15mm] space-y-1 text-sm print:text-[11px] leading-relaxed"
      >
        {/* Header */}
        <div className="text-center space-y-1 mb-6 print:mb-4">
          <h1 className="text-lg font-bold uppercase tracking-widest print:text-base">
            Employment Contract / Anställningsavtal
          </h1>
          <p className="text-xs text-muted-foreground print:text-gray-500">
            {contractCode && `${contractCode} · `}Season / Säsong: {seasonYear || new Date().getFullYear()}
          </p>
        </div>

        {/* Section 1: Employer */}
        <SectionTitle number="1" titleEn="Employer" titleSv="Arbetsgivare" />
        <div className="grid grid-cols-2 gap-4 print:gap-2">
          <Field label="Employer" labelSv="Arbetsgivare" value={companyName} />
          <Field label="Organization Number" labelSv="Organisationsnummer" value={companyOrgNumber} />
          <Field label="Address" labelSv="Adress" value={companyAddress} />
          <Field label="Postcode & City" labelSv="Postnummer & Ort" value={`${companyPostcode || ""} ${companyCity || ""}`.trim() || null} />
        </div>

        {/* Section 2: Employee */}
        <SectionTitle number="2" titleEn="Employee" titleSv="Arbetstagare" />
        <div className="grid grid-cols-3 gap-4 print:gap-2">
          <Field label="First Name" labelSv="Förnamn" value={fd.firstName} />
          <Field label="Middle Name" labelSv="Mellannamn" value={fd.middleName} />
          <Field label="Last Name" labelSv="Efternamn" value={fd.lastName} />
        </div>
        <div className="grid grid-cols-2 gap-4 print:gap-2 mt-2">
          <Field label="Address" labelSv="Adress" value={fd.address} />
          <Field label="City" labelSv="Ort" value={fd.city} />
          <Field label="Postcode" labelSv="Postnummer" value={fd.zipCode} />
          <Field label="Country" labelSv="Land" value={fd.country} />
          <Field label="Date of Birth" labelSv="Födelsedatum" value={formatDate(fd.birthday)} />
          <Field label="Citizenship" labelSv="Medborgarskap" value={fd.citizenship} />
          <Field label="Mobile" labelSv="Mobilnummer" value={fd.mobile} />
          <Field label="Email" labelSv="E-post" value={fd.email} />
        </div>

        {/* Emergency Contact */}
        {(fd.emergencyFirstName || fd.emergencyLastName) && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-3 print:text-gray-500">
              Emergency Contact / Nödkontakt
            </p>
            <div className="grid grid-cols-3 gap-4 print:gap-2">
              <Field label="First Name" labelSv="Förnamn" value={fd.emergencyFirstName} />
              <Field label="Last Name" labelSv="Efternamn" value={fd.emergencyLastName} />
              <Field label="Mobile" labelSv="Mobilnummer" value={fd.emergencyMobile} />
            </div>
          </>
        )}

        {/* Section 3: Employment */}
        <SectionTitle number="3" titleEn="Position & Duties" titleSv="Befattning & arbetsuppgifter" />
        <div className="grid grid-cols-2 gap-4 print:gap-2">
          <Field label="Main Duties" labelSv="Huvudsakliga arbetsuppgifter" value={fd.mainDuties} />
          <Field label="Job Type" labelSv="Anställningstyp" value={fd.jobType} />
          <Field label="Experience Level" labelSv="Erfarenhetsnivå" value={fd.experienceLevel} />
          <Field label="Posting Location" labelSv="Stationeringsort" value={fd.postingLocation} />
          <Field label="Main Workplace" labelSv="Huvudarbetsplats" value={fd.mainWorkplace} />
          <Field label="Workplace Varies" labelSv="Arbetsplats varierar" value={fd.workplaceVaries} />
        </div>

        {/* Section 4: Form of Employment */}
        <SectionTitle number="4" titleEn="Form of Employment" titleSv="Anställningsform" />
        <Field
          label="Employment Form"
          labelSv="Anställningsform"
          value={employmentFormLabels[fd.employmentForm] || fd.employmentForm}
        />
        {fd.employmentForm === "permanent" && (
          <Field label="From Date" labelSv="Från datum" value={formatDate(fd.permanentFromDate)} />
        )}
        {fd.employmentForm === "probation" && (
          <div className="grid grid-cols-2 gap-4 print:gap-2">
            <Field label="From" labelSv="Från" value={formatDate(fd.probationFromDate)} />
            <Field label="Until" labelSv="Till" value={formatDate(fd.probationUntilDate)} />
          </div>
        )}
        {fd.employmentForm === "fixed-term" && (
          <div className="grid grid-cols-2 gap-4 print:gap-2">
            <Field label="From" labelSv="Från" value={formatDate(fd.fixedTermFromDate)} />
            <Field label="Until" labelSv="Till" value={formatDate(fd.fixedTermUntilDate)} />
          </div>
        )}
        {fd.employmentForm === "seasonal" && (
          <div className="grid grid-cols-2 gap-4 print:gap-2">
            <Field label="From" labelSv="Från" value={formatDate(fd.seasonalFromDate)} />
            <Field label="End Around" labelSv="Slutar omkring" value={formatDate(fd.seasonalEndAround)} />
          </div>
        )}

        {/* Section 5: Working Time */}
        <SectionTitle number="5" titleEn="Working Time & Leave" titleSv="Arbetstid & semester" />
        <div className="grid grid-cols-3 gap-4 print:gap-2">
          <Field label="Working Time" labelSv="Arbetstid" value={fd.workingTime === "part-time" ? `Part-time ${fd.partTimePercent || ""}%` : "Full-time / Heltid"} />
          <Field label="Annual Leave" labelSv="Semesterdagar" value={fd.annualLeaveDays ? `${fd.annualLeaveDays} days` : null} />
        </div>

        {/* Section 7/8: Salary */}
        <SectionTitle number="7" titleEn="Compensation" titleSv="Ersättning" />
        <Field label="Salary Type" labelSv="Lönetyp" value={salaryTypeLabels[fd.salaryType] || fd.salaryType} />
        {fd.salaryType === "hourly" && (
          <div className="grid grid-cols-2 gap-4 print:gap-2 mt-1">
            <Field label="Hourly Basic Rate" labelSv="Grundtimlön" value={fd.hourlyBasic ? `${fd.hourlyBasic} SEK` : null} />
            <Field label="Hourly Premium" labelSv="Tillägg" value={fd.hourlyPremium ? `${fd.hourlyPremium} SEK` : null} />
          </div>
        )}
        {fd.salaryType === "monthly" && (
          <div className="grid grid-cols-2 gap-4 print:gap-2 mt-1">
            <Field label="Monthly Basic Rate" labelSv="Grundmånadslön" value={fd.monthlyBasic ? `${fd.monthlyBasic} SEK` : null} />
            <Field label="Monthly Premium" labelSv="Tillägg" value={fd.monthlyPremium ? `${fd.monthlyPremium} SEK` : null} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 print:gap-2 mt-1">
          <Field label="Piece Work Pay" labelSv="Ackordslön" value={fd.pieceWorkPay} />
          <Field label="Other Benefits" labelSv="Övriga förmåner" value={fd.otherSalaryBenefits} />
          <Field label="Payment Method" labelSv="Utbetalningssätt" value={fd.paymentMethod} />
        </div>

        {/* Section 9: Training */}
        {(fd.trainingSkotselskolan || fd.trainingSYN || fd.trainingOtherText) && (
          <>
            <SectionTitle number="9" titleEn="Training" titleSv="Utbildning" />
            <div className="space-y-1">
              {fd.trainingSkotselskolan && <p className="text-sm print:text-xs">☑ Skötselskolan</p>}
              {fd.trainingSYN && <p className="text-sm print:text-xs">☑ SYN (Säkerhets- och yrkesutbildning)</p>}
              {fd.trainingOtherText && <p className="text-sm print:text-xs">Other / Annat: {fd.trainingOtherText}</p>}
            </div>
          </>
        )}

        {/* Section 10: Social Security */}
        <SectionTitle number="10" titleEn="Social Security" titleSv="Social trygghet" />
        <p className="text-sm print:text-xs text-muted-foreground print:text-gray-600">
          Social security contributions and insurance are provided in accordance with Swedish law and applicable collective agreements. /
          Sociala avgifter och försäkringar tillhandahålls i enlighet med svensk lag och tillämpliga kollektivavtal.
        </p>

        {/* Section 11: Miscellaneous */}
        {fd.miscellaneousText && (
          <>
            <SectionTitle number="11" titleEn="Miscellaneous" titleSv="Övrigt" />
            <p className="text-sm print:text-xs whitespace-pre-wrap">{fd.miscellaneousText}</p>
          </>
        )}

        {/* Section 13: Deductions */}
        {fd.salaryDeductions && fd.salaryDeductions.length > 0 && (
          <>
            <SectionTitle number="13" titleEn="Net Salary Deductions" titleSv="Nettolöneavdrag" />
            <div className="space-y-2">
              {fd.salaryDeductions.map((d: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-border/50 pb-1 print:border-gray-200">
                  <span className="text-sm print:text-xs">{d.label || d.type}{d.note ? ` — ${d.note}` : ""}</span>
                  <span className="text-sm font-medium print:text-xs">
                    {d.amount ? `${d.amount} SEK` : "—"} / {d.frequency}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Signing section */}
        <div className="mt-10 print:mt-8 pt-6 border-t-2 border-foreground/20 print:border-gray-400">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-6 print:text-xs print:mb-4">
            Signatures / Underskrifter
          </h3>
          <div className="grid grid-cols-2 gap-12 print:gap-8">
            {/* Employer */}
            <div className="space-y-6 print:space-y-4">
              <div className="space-y-1">
                <div className="border-b border-foreground/30 pb-1 h-8 print:h-6 print:border-gray-400" />
                <p className="text-[10px] text-muted-foreground print:text-gray-500">Place and date / Plats och datum</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-foreground/30 pb-1 h-8 print:h-6 print:border-gray-400">
                  <span className="text-sm print:text-xs">{companyName}</span>
                </div>
                <p className="text-[10px] text-muted-foreground print:text-gray-500">Company / Företag</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-foreground/30 pb-1 h-10 print:h-8 flex items-end print:border-gray-400">
                  {employerSignatureUrl && (
                    <img src={employerSignatureUrl} alt="Employer signature" className="h-8 print:h-6 object-contain" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground print:text-gray-500">Employer's signature / Arbetsgivarens underskrift</p>
                {employerSignedAt && (
                  <p className="text-[10px] text-muted-foreground print:text-gray-400">Signed: {formatDate(employerSignedAt)}</p>
                )}
              </div>
            </div>
            {/* Employee */}
            <div className="space-y-6 print:space-y-4">
              <div className="space-y-1">
                <div className="border-b border-foreground/30 pb-1 h-8 print:h-6 print:border-gray-400" />
                <p className="text-[10px] text-muted-foreground print:text-gray-500">Place and date / Plats och datum</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-foreground/30 pb-1 h-8 print:h-6 print:border-gray-400">
                  <span className="text-sm print:text-xs">{fd.firstName} {fd.lastName}</span>
                </div>
                <p className="text-[10px] text-muted-foreground print:text-gray-500">Employee / Arbetstagare</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-foreground/30 pb-1 h-10 print:h-8 flex items-end print:border-gray-400">
                  {employeeSignatureUrl && (
                    <img src={employeeSignatureUrl} alt="Employee signature" className="h-8 print:h-6 object-contain" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground print:text-gray-500">Employee's signature / Arbetstagarens underskrift</p>
                {employeeSignedAt && (
                  <p className="text-[10px] text-muted-foreground print:text-gray-400">Signed: {formatDate(employeeSignedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
