import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "@/components/dashboard/SignatureCanvas";
import { ContractDocument } from "@/components/dashboard/ContractDocument";
import { CheckCircle, Loader2, AlertTriangle, FileText, Check, ExternalLink, Calendar, RotateCcw, Send, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/ljungan-forestry-logo-new.jpg";
import { format, addDays, eachDayOfInterval, getDay } from "date-fns";

const PUBLISHED_ORIGIN = "https://erptable.lovable.app";

const COC_LANGUAGES = [
  { code: "sv", label: "Svenska", labelEn: "Swedish", file: "/documents/code-of-conduct-sv.pdf" },
  { code: "en", label: "English", labelEn: "English", file: "/documents/code-of-conduct-en.pdf" },
  { code: "ro", label: "Română", labelEn: "Romanian", file: "/documents/code-of-conduct-ro.pdf" },
  { code: "th", label: "ไทย", labelEn: "Thai", file: "/documents/code-of-conduct-th.pdf" },
  { code: "uk", label: "Українська", labelEn: "Ukrainian", file: "/documents/code-of-conduct-uk.pdf" },
];

// PDFs that actually exist in public/documents/
const AVAILABLE_COC_PDFS = new Set(["sv", "en", "ro", "th", "uk"]);

// Swedish public holidays calculation
function getSwedishHolidays(year: number): { date: string; nameEn: string; nameSv: string }[] {
  const fixed = [
    { m: 1, d: 1, nameEn: "New Year's Day", nameSv: "Nyårsdagen" },
    { m: 1, d: 6, nameEn: "Epiphany", nameSv: "Trettondedag jul" },
    { m: 5, d: 1, nameEn: "Labour Day", nameSv: "Första Maj" },
    { m: 6, d: 6, nameEn: "National Day", nameSv: "Sveriges nationaldag" },
    { m: 12, d: 24, nameEn: "Christmas Eve", nameSv: "Julafton" },
    { m: 12, d: 25, nameEn: "Christmas Day", nameSv: "Juldagen" },
    { m: 12, d: 26, nameEn: "Second Day of Christmas", nameSv: "Annandag jul" },
    { m: 12, d: 31, nameEn: "New Year's Eve", nameSv: "Nyårsafton" },
  ];
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  const easterBased = [
    { offset: -2, nameEn: "Good Friday", nameSv: "Långfredagen" },
    { offset: 0, nameEn: "Easter Sunday", nameSv: "Påskdagen" },
    { offset: 1, nameEn: "Easter Monday", nameSv: "Annandag påsk" },
    { offset: 39, nameEn: "Ascension Day", nameSv: "Kristi himmelsfärdsdag" },
    { offset: 49, nameEn: "Pentecost Sunday", nameSv: "Pingstdagen" },
  ];
  let midsummerEve = new Date(year, 5, 19);
  while (midsummerEve.getDay() !== 5) midsummerEve = addDays(midsummerEve, 1);
  let allSaints = new Date(year, 9, 31);
  while (allSaints.getDay() !== 6) allSaints = addDays(allSaints, 1);
  const holidays = fixed.map(h => ({
    date: `${year}-${String(h.m).padStart(2, "0")}-${String(h.d).padStart(2, "0")}`,
    nameEn: h.nameEn, nameSv: h.nameSv,
  }));
  easterBased.forEach(eb => {
    const dd = addDays(easter, eb.offset);
    holidays.push({ date: format(dd, "yyyy-MM-dd"), nameEn: eb.nameEn, nameSv: eb.nameSv });
  });
  holidays.push({ date: format(midsummerEve, "yyyy-MM-dd"), nameEn: "Midsummer Eve", nameSv: "Midsommarafton" });
  holidays.push({ date: format(addDays(midsummerEve, 1), "yyyy-MM-dd"), nameEn: "Midsummer Day", nameSv: "Midsommardagen" });
  holidays.push({ date: format(allSaints, "yyyy-MM-dd"), nameEn: "All Saints' Day", nameSv: "Alla helgons dag" });
  return holidays;
}

interface ScheduleDay {
  date: string;
  dayType: string;
  hours: number;
  holidayEn?: string;
  holidaySv?: string;
}

function generateSchedule(schedData: Record<string, any>): ScheduleDay[] {
  const startStr = schedData.workStartDate || schedData.contractStartDate;
  const endStr = schedData.workEndDate || schedData.contractEndDate;
  if (!startStr || !endStr) return [];
  
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const weeklyHours = Number(schedData.weeklyHours) || 40;
  const dailyHours = weeklyHours / 5;
  
  // Gather holidays for all years in range
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const holidayMap = new Map<string, { nameEn: string; nameSv: string }>();
  for (let y = startYear; y <= endYear; y++) {
    getSwedishHolidays(y).forEach(h => holidayMap.set(h.date, { nameEn: h.nameEn, nameSv: h.nameSv }));
  }

  // Vacation range
  const vacStart = schedData.vacationEnabled && schedData.vacationStartDate ? new Date(schedData.vacationStartDate) : null;
  const vacEnd = schedData.vacationEnabled && schedData.vacationEndDate ? new Date(schedData.vacationEndDate) : null;

  const days = eachDayOfInterval({ start, end });
  return days.map(d => {
    const dateStr = format(d, "yyyy-MM-dd");
    const dow = getDay(d); // 0=Sun, 6=Sat
    const holiday = holidayMap.get(dateStr);
    const isVacation = vacStart && vacEnd && d >= vacStart && d <= vacEnd;

    if (holiday) return { date: dateStr, dayType: "Holiday", hours: 0, holidayEn: holiday.nameEn, holidaySv: holiday.nameSv };
    if (isVacation) return { date: dateStr, dayType: "Vacation", hours: 0 };
    if (dow === 0 || dow === 6) return { date: dateStr, dayType: "Weekend", hours: 0 };
    return { date: dateStr, dayType: "Workday", hours: Math.round(dailyHours * 100) / 100 };
  });
}

interface SigningData {
  contract_id: string;
  contract_code: string;
  company_name: string;
  employee_first_name: string;
  employee_last_name: string;
  signing_status: string;
  employee_signed_at: string | null;
  employer_signed_at: string | null;
  form_data: Record<string, any> | null;
  company_org_number: string | null;
  company_address: string | null;
  company_postcode: string | null;
  company_city: string | null;
  employee_email: string | null;
  employee_phone: string | null;
  season_year: string | null;
}

export default function ContractSigning() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SigningData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);

  // Code of Conduct state
  const [cocLanguage, setCocLanguage] = useState<string | null>(null);
  
  const [cocConfirmed, setCocConfirmed] = useState(false);
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [scheduleReviewed, setScheduleReviewed] = useState(false);

  // Place & Date for signing
  const [signingPlace, setSigningPlace] = useState("");
  const [signingDate, setSigningDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Signature preview (redo flow)
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);

  // Ref for schedule section (scroll-to + auto-review)
  const scheduleCardRef = useRef<HTMLDivElement>(null);
  const scheduleBottomRef = useRef<HTMLDivElement>(null);

  // Auto-review schedule when bottom of schedule table becomes visible
  useEffect(() => {
    const el = scheduleBottomRef.current;
    if (!el || scheduleReviewed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setScheduleReviewed(true), 1500);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scheduleReviewed]);

  const scrollToSchedule = useCallback(() => {
    scheduleCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data: rows, error: err } = await supabase.rpc("get_contract_for_signing", {
        _token: token,
      });
      if (err || !rows || rows.length === 0) {
        setError("Invalid or expired signing link.");
        setLoading(false);
        return;
      }
      setData(rows[0] as unknown as SigningData);
      setLoading(false);
    };
    load();
  }, [token]);

  // Derive schedule days from form data (must be before early returns)
  const fd = data?.form_data || {};
  const schedData = (fd as Record<string, any>).schedulingData as Record<string, any> | undefined;
  const scheduleDays = useMemo(() => schedData ? generateSchedule(schedData) : [], [schedData]);

  const handleSign = async (dataUrl: string) => {
    if (!token || !data) return;
    setSubmitting(true);

    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke(
        "upload-employee-signature",
        { body: { token, signatureDataUrl: dataUrl, signingPlace, signingDate } }
      );

      if (fnErr) throw fnErr;
      if (result?.error) throw new Error(result.error);
      setSigned(true);
    } catch (err: any) {
      setSigningError(err.message || "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Signing Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const alreadySigned = data.signing_status !== "sent_to_employee" || data.employee_signed_at;
  const selectedCocLang = COC_LANGUAGES.find((l) => l.code === cocLanguage);
  const hasSchedule = !!schedData;
  const canSign = cocConfirmed && contractConfirmed && signingPlace.trim().length > 0 && (!hasSchedule || scheduleReviewed);

  const stepNumberSchedule = hasSchedule ? 3 : null;
  const stepNumberSign = hasSchedule ? 4 : 3;

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8 safe-area-top safe-area-bottom">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <img src={logoImg} alt="Logo" className="h-10 sm:h-12 mx-auto" />
        </div>

        {/* Step 1: Full Contract Document */}
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-accent/30 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Step 1: Review Employment Contract / Steg 1: Granska anställningsavtalet
            </CardTitle>
          </CardHeader>
            <ContractDocument
              companyName={data.company_name}
              companyOrgNumber={data.company_org_number}
              companyAddress={data.company_address}
              companyPostcode={data.company_postcode}
              companyCity={data.company_city}
              contractCode={data.contract_code}
              seasonYear={data.season_year}
              formData={fd}
              employeeSignatureUrl={(data as any).employee_signature_url || null}
              employerSignatureUrl={(data as any).employer_signature_url || null}
              employeeSignedAt={data.employee_signed_at}
              employerSignedAt={data.employer_signed_at}
              employeeSigningMetadata={(data as any).employee_signing_metadata as Record<string, any> | undefined}
              employerSigningMetadata={(data as any).employer_signing_metadata as Record<string, any> | undefined}
            />
          </CardContent>
        </Card>

        {/* Code of Conduct Review */}
        {!alreadySigned && !signed && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Code of Conduct
                <span className="text-muted-foreground font-normal text-sm">/ Uppförandekod</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Please review the Code of Conduct before signing. Select your preferred language. /
                <span className="italic"> Vänligen granska uppförandekoden innan du signerar. Välj önskat språk.</span>
              </p>

              {/* Language selection */}
              <div className="grid grid-cols-2 gap-3">
                {COC_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setCocLanguage(lang.code); setCocConfirmed(false); setCocScrolledToBottom(false); }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 p-3 sm:p-4 text-left transition-all",
                      cocLanguage === lang.code
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/40"
                    )}
                  >
                    <div>
                      <p className="font-semibold text-sm">{lang.label}</p>
                      <p className="text-xs text-muted-foreground">{lang.labelEn}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* PDF viewer embedded */}
              {selectedCocLang && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                      Document / Dokument — {selectedCocLang.label}
                    </label>
                  </div>

                  {!AVAILABLE_COC_PDFS.has(cocLanguage!) ? (
                    /* PDF not available for this language */
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        The Code of Conduct document is not yet available in {selectedCocLang.label}. Please select another language. /
                        <span className="italic"> Uppförandekoden finns ännu inte på {selectedCocLang.label}. Vänligen välj ett annat språk.</span>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {/* Scrollable container — user must scroll to bottom to reveal confirmation */}
                      <div
                        ref={cocScrollContainerRef}
                        onScroll={handleCocScroll}
                        className="rounded-lg border border-border overflow-hidden bg-muted/20 max-h-[500px] overflow-y-auto"
                      >
                        <iframe
                          key={cocLanguage}
                          src={selectedCocLang.file}
                          className="w-full"
                          style={{ border: "none", height: "900px" }}
                          title={`Code of Conduct - ${selectedCocLang.label}`}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={selectedCocLang.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in new tab / Öppna i ny flik
                        </a>
                      </div>

                      {/* CoC confirmation toggle — only appears after scrolling to bottom */}
                      {cocScrolledToBottom && (
                        <button
                          type="button"
                          onClick={() => setCocConfirmed(!cocConfirmed)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-all text-left",
                            cocConfirmed
                              ? "border-primary bg-primary/10"
                              : "border-primary/50 bg-muted/20 animate-pulse"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-6 rounded-full relative shrink-0 transition-colors",
                            cocConfirmed ? "bg-primary" : "bg-muted-foreground/30"
                          )}>
                            <div className={cn(
                              "absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform",
                              cocConfirmed ? "translate-x-[18px]" : "translate-x-0.5"
                            )} />
                          </div>
                          <span className={cn("text-sm font-medium", cocConfirmed && "text-primary")}>
                            {cocConfirmed ? "✓ " : ""}
                            I have read and understood the Code of Conduct. /
                            <span className="italic text-muted-foreground"> Jag har läst och förstått uppförandekoden.</span>
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Schedule Appendix Review */}
        {!alreadySigned && !signed && schedData && (
          <Card className="shadow-md" ref={scheduleCardRef}>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule Appendix / Schemabilaga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary info */}
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Contract period / Avtalsperiod:</span>
                  <span className="font-medium">{schedData.contractStartDate || "—"} → {schedData.contractEndDate || "—"}</span>
                  <span className="text-muted-foreground">Work period / Arbetsperiod:</span>
                  <span className="font-medium">{schedData.workStartDate || "—"} → {schedData.workEndDate || "—"}</span>
                  <span className="text-muted-foreground">Weekly hours / Veckotimmar:</span>
                  <span className="font-medium">{schedData.weeklyHours || 40}h</span>
                  <span className="text-muted-foreground">Daily hours / Dagliga timmar:</span>
                  <span className="font-medium">{schedData.startTime || "06:30"} – {schedData.endTime || "17:00"}</span>
                  {schedData.vacationEnabled && (
                    <>
                      <span className="text-muted-foreground">Vacation / Semester:</span>
                      <span className="font-medium">{schedData.vacationStartDate || "—"} → {schedData.vacationEndDate || "—"}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Statistics */}
              {scheduleDays.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Workdays", sv: "Arbetsdagar", value: scheduleDays.filter(d => d.dayType === "Workday").length, color: "text-primary" },
                    { label: "Holidays", sv: "Helgdagar", value: scheduleDays.filter(d => d.dayType === "Holiday").length, color: "text-destructive" },
                    { label: "Vacation", sv: "Semester", value: scheduleDays.filter(d => d.dayType === "Vacation").length, color: "text-amber-600" },
                    { label: "Total hours", sv: "Totala timmar", value: Math.round(scheduleDays.reduce((s, d) => s + d.hours, 0)), color: "text-foreground" },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg border border-border bg-background p-3 text-center">
                      <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label} / {stat.sv}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Full day-by-day schedule */}
              {scheduleDays.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b border-border">
                          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date / Datum</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day / Dag</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type / Typ</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours / Tim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleDays.map((day) => {
                          const d = new Date(day.date);
                          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                          const typeColors: Record<string, string> = {
                            Workday: "text-primary bg-primary/5",
                            Weekend: "text-muted-foreground bg-muted/30",
                            Holiday: "text-destructive bg-destructive/5",
                            Vacation: "text-amber-600 bg-amber-50",
                          };
                          const colorClass = typeColors[day.dayType] || "text-muted-foreground";
                          return (
                            <tr key={day.date} className={cn("border-b border-border/50 last:border-0", day.dayType === "Weekend" && "bg-muted/30", day.dayType === "Holiday" && "bg-destructive/5", day.dayType === "Vacation" && "bg-amber-50")}>
                              <td className="px-3 py-1.5 font-medium tabular-nums">{day.date}</td>
                              <td className={cn("px-3 py-1.5 text-muted-foreground", day.dayType === "Weekend" && "font-semibold")}>{dayName}</td>
                              <td className="px-3 py-1.5">
                                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", colorClass)}>
                                  {day.dayType}
                                  {day.holidayEn && <span className="text-[10px] opacity-70">({day.holidayEn})</span>}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums font-medium">{day.hours > 0 ? `${day.hours}h` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div ref={scheduleBottomRef} className="flex items-center gap-3">
                {!scheduleReviewed && (
                  <Button onClick={() => setScheduleReviewed(true)} className="gap-2 animate-pulse">
                    <Check className="w-4 h-4" />
                    Mark as reviewed / Markera som granskad
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signing Area — only visible after CoC is confirmed (or already signed) */}
        {(cocConfirmed || signed || alreadySigned) && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Employee Signature / Anställds underskrift</CardTitle>
          </CardHeader>
          <CardContent>
            {signed || alreadySigned ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                <p className="text-lg font-semibold text-primary">
                  Signed Successfully / Signerat framgångsrikt
                </p>
                <p className="text-sm text-muted-foreground">
                  The contract will now be sent to the employer for their signature. / 
                  Avtalet skickas nu till arbetsgivaren för deras underskrift.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Confirmation checkboxes */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">
                    Confirmations / Bekräftelser
                  </p>
                  <label
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setContractConfirmed(!contractConfirmed)}
                  >
                    <div className={cn(
                      "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      contractConfirmed ? "border-primary bg-primary" : "border-muted-foreground/40"
                    )}>
                      {contractConfirmed && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">
                      I have read and agree to the terms of this employment contract and schedule. /
                      <span className="italic text-muted-foreground"> Jag har läst och godkänner villkoren i detta anställningsavtal och schema.</span>
                    </span>
                  </label>
                </div>

                {/* Place & Date fields */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Place and Date / Plats och datum
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signing-place" className="text-sm">Place / Plats *</Label>
                      <Input
                        id="signing-place"
                        value={signingPlace}
                        onChange={(e) => setSigningPlace(e.target.value)}
                        placeholder="e.g. Stockholm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signing-date" className="text-sm">Date / Datum</Label>
                      <Input
                        id="signing-date"
                        type="date"
                        value={signingDate}
                        onChange={(e) => setSigningDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Signing error */}
                {signingError && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{signingError}</span>
                      <Button variant="outline" size="sm" onClick={() => setSigningError(null)} className="ml-3 shrink-0">
                        Dismiss / Stäng
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Missing steps checklist (shown above canvas when not all done) */}
                {!canSign && (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Complete these steps to sign / Slutför dessa steg för att signera:
                    </p>
                    <ul className="space-y-2 text-sm">
                      {[
                        { done: contractConfirmed, label: "Confirm contract terms / Bekräfta avtalsvillkoren" },
                        { done: cocConfirmed, label: "Confirm Code of Conduct / Bekräfta uppförandekoden" },
                        ...(hasSchedule ? [{ done: scheduleReviewed, label: "Review schedule / Granska schemat" }] : []),
                        { done: signingPlace.trim().length > 0, label: "Enter signing place / Ange ort" },
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {item.done ? (
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                          )}
                          <span className={cn(item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Signature area — always visible, disabled until canSign */}
                {pendingSignature ? (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">
                      Review your signature / Granska din namnteckning:
                    </p>
                    <div className="rounded-lg border-2 border-primary/30 bg-background p-4">
                      <img
                        src={pendingSignature}
                        alt="Your signature"
                        className="max-h-[120px] mx-auto"
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setPendingSignature(null)}
                        disabled={submitting}
                        className="gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Redo / Gör om
                      </Button>
                      <Button
                        onClick={() => handleSign(pendingSignature)}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {submitting ? "Submitting..." : "Submit Signature / Skicka in"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {canSign
                        ? "Draw your signature below to sign the contract. / Rita din namnteckning nedan för att signera avtalet."
                        : "Complete the steps above to enable signing. / Slutför stegen ovan för att kunna signera."}
                    </p>
                    <SignatureCanvas onSave={(dataUrl) => setPendingSignature(dataUrl)} disabled={submitting || !canSign} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
