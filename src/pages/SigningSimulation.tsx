import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "@/components/dashboard/SignatureCanvas";
import { ContractDocument } from "@/components/dashboard/ContractDocument";
import {
  CheckCircle, Loader2, AlertTriangle, FileText, Check,
  Calendar, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { CodeOfConductViewer } from "@/components/dashboard/CodeOfConductViewer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, addDays, eachDayOfInterval, getDay } from "date-fns";
import logoImg from "@/assets/ljungan-forestry-logo-new.jpg";

const COC_LANGUAGES = [
  { code: "sv", label: "Svenska", labelEn: "Swedish", file: "/documents/code-of-conduct-sv.pdf" },
  { code: "en", label: "English", labelEn: "English", file: "/documents/code-of-conduct-en.pdf" },
  { code: "ro", label: "Română", labelEn: "Romanian", file: "/documents/code-of-conduct-ro.pdf" },
  { code: "th", label: "ไทย", labelEn: "Thai", file: "/documents/code-of-conduct-th.pdf" },
  { code: "uk", label: "Українська", labelEn: "Ukrainian", file: "/documents/code-of-conduct-uk.pdf" },
];

// ── Swedish holidays (shared with ContractSigning) ──
function getSwedishHolidays(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month, day);
  const fixed = [
    { m: 1, d: 1, nameEn: "New Year's Day", nameSv: "Nyårsdagen" },
    { m: 1, d: 6, nameEn: "Epiphany", nameSv: "Trettondedag jul" },
    { m: 5, d: 1, nameEn: "May Day", nameSv: "Första maj" },
    { m: 6, d: 6, nameEn: "National Day", nameSv: "Nationaldagen" },
    { m: 12, d: 24, nameEn: "Christmas Eve", nameSv: "Julafton" },
    { m: 12, d: 25, nameEn: "Christmas Day", nameSv: "Juldagen" },
    { m: 12, d: 26, nameEn: "Boxing Day", nameSv: "Annandag jul" },
    { m: 12, d: 31, nameEn: "New Year's Eve", nameSv: "Nyårsafton" },
  ];
  const easterBased = [
    { offset: -2, nameEn: "Good Friday", nameSv: "Långfredagen" },
    { offset: 0, nameEn: "Easter Sunday", nameSv: "Påskdagen" },
    { offset: 1, nameEn: "Easter Monday", nameSv: "Annandag påsk" },
    { offset: 39, nameEn: "Ascension Day", nameSv: "Kristi himmelsfärdsdag" },
    { offset: 49, nameEn: "Whit Sunday", nameSv: "Pingstdagen" },
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

function generateScheduleFromFormData(schedData: Record<string, any>): ScheduleDay[] {
  const startStr = schedData.workStartDate || schedData.contractStartDate;
  const endStr = schedData.workEndDate || schedData.contractEndDate;
  if (!startStr || !endStr) return [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
  const weeklyHours = Number(schedData.weeklyHours) || 40;
  const dailyHours = weeklyHours / 5;
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const holidayMap = new Map<string, { nameEn: string; nameSv: string }>();
  for (let y = startYear; y <= endYear; y++) {
    getSwedishHolidays(y).forEach(h => holidayMap.set(h.date, { nameEn: h.nameEn, nameSv: h.nameSv }));
  }
  const vacStart = schedData.vacationEnabled && schedData.vacationStartDate ? new Date(schedData.vacationStartDate) : null;
  const vacEnd = schedData.vacationEnabled && schedData.vacationEndDate ? new Date(schedData.vacationEndDate) : null;
  const days = eachDayOfInterval({ start, end });
  return days.map(d => {
    const dateStr = format(d, "yyyy-MM-dd");
    const dow = getDay(d);
    const holiday = holidayMap.get(dateStr);
    const isVacation = vacStart && vacEnd && d >= vacStart && d <= vacEnd;
    if (holiday) return { schedule_date: dateStr, day_type: "Holiday", scheduled_hours: 0, start_time: null, end_time: null, holiday_name_en: holiday.nameEn, holiday_name_sv: holiday.nameSv };
    if (isVacation) return { schedule_date: dateStr, day_type: "Vacation", scheduled_hours: 0, start_time: null, end_time: null, holiday_name_en: null, holiday_name_sv: null };
    if (dow === 0 || dow === 6) return { schedule_date: dateStr, day_type: "Weekend", scheduled_hours: 0, start_time: null, end_time: null, holiday_name_en: null, holiday_name_sv: null };
    return { schedule_date: dateStr, day_type: "Workday", scheduled_hours: Math.round(dailyHours * 100) / 100, start_time: schedData.startTime || "06:30", end_time: schedData.endTime || "17:00", holiday_name_en: null, holiday_name_sv: null };
  });
}

interface ContractRow {
  id: string;
  contract_code: string | null;
  season_year: string | null;
  signing_status: string;
  signing_token: string | null;
  employee_signature_url: string | null;
  employer_signature_url: string | null;
  form_data: Record<string, any> | null;
  company_id: string | null;
}

interface ScheduleDay {
  schedule_date: string;
  day_type: string;
  scheduled_hours: number;
  start_time: string | null;
  end_time: string | null;
  holiday_name_en: string | null;
  holiday_name_sv: string | null;
}

export default function SigningSimulation() {
  const { contractId } = useParams<{ contractId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [company, setCompany] = useState<Record<string, any> | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signingPlace, setSigningPlace] = useState("");
  const [signingDate, setSigningDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [signingError, setSigningError] = useState<string | null>(null);

  // Review states
  const [cocLanguage, setCocLanguage] = useState<string | null>(null);
  const [cocConfirmed, setCocConfirmed] = useState(false);
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [scheduleReviewed, setScheduleReviewed] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    const load = async (retries = 2): Promise<void> => {
      // Load contract (use maybeSingle to avoid error when RLS blocks temporarily)
      const { data: c, error: cErr } = await supabase
        .from("contracts")
        .select("id, contract_code, season_year, signing_status, signing_token, employee_signature_url, employer_signature_url, form_data, company_id, employee_signing_metadata, employer_signing_metadata, employee_signed_at, employer_signed_at")
        .eq("id", contractId)
        .maybeSingle();

      if (cErr || !c) {
        // Retry once after a delay (session may not be ready in new tab)
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return load(retries - 1);
        }
        setError("Contract not found.");
        setLoading(false);
        return;
      }
      setContract(c as unknown as ContractRow);

      // Load company
      if (c.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("name, org_number, address, postcode, city")
          .eq("id", c.company_id)
          .maybeSingle();
        if (comp) setCompany(comp);
      }

      // Load schedule
      const { data: sched } = await supabase
        .from("contract_schedules")
        .select("schedule_date, day_type, scheduled_hours, start_time, end_time, holiday_name_en, holiday_name_sv")
        .eq("contract_id", contractId)
        .order("schedule_date");
      if (sched && sched.length > 0) {
        setSchedule(sched);
      } else {
        // Fallback: generate from form_data schedulingData
        const fd = (c.form_data || {}) as Record<string, any>;
        const sd = fd.schedulingData as Record<string, any> | undefined;
        if (sd) {
          setSchedule(generateScheduleFromFormData(sd));
        }
      }

      setLoading(false);
    };
    load();
  }, [contractId]);

  const handleSign = async (dataUrl: string) => {
    if (!contract?.signing_token) return;
    setSubmitting(true);
    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke(
        "upload-employee-signature",
        { body: { token: contract.signing_token, signatureDataUrl: dataUrl, signingPlace, signingDate } }
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

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm text-muted-foreground">{error || "Contract not found."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fd = (contract.form_data || {}) as Record<string, any>;
  const schedData = fd.schedulingData as Record<string, any> | undefined;
  const alreadySigned = contract.signing_status !== "sent_to_employee" || contract.employee_signature_url;
  const selectedCocLang = COC_LANGUAGES.find((l) => l.code === cocLanguage);
  const hasSchedule = schedule.length > 0 || schedData;
  const canSign = cocConfirmed && contractConfirmed && (scheduleReviewed || !hasSchedule) && signingPlace.trim().length > 0;

  // Day type colors
  const dayTypeColor = (t: string) => {
    switch (t) {
      case "Workday": return "text-foreground";
      case "Weekend": return "text-muted-foreground";
      case "Holiday": return "text-destructive";
      case "Vacation": return "text-primary";
      default: return "text-muted-foreground/60";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 safe-area-top safe-area-bottom">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="h-8" />
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-muted-foreground">Employee Contract Review & Signing</p>
            <p className="text-xs text-muted-foreground italic">Anställds avtalsgranskning & signering</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium">{contract.contract_code || "—"}</p>
          <p className="text-xs text-muted-foreground">Season {contract.season_year || new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-6">
        {/* Step 1: Full Contract Document */}
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-accent/30 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Step 1: Review Employment Contract / Steg 1: Granska anställningsavtalet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ContractDocument
              companyName={company?.name || "—"}
              companyOrgNumber={company?.org_number}
              companyAddress={company?.address}
              companyPostcode={company?.postcode}
              companyCity={company?.city}
              contractCode={contract.contract_code}
              seasonYear={contract.season_year}
              formData={fd}
              employeeSignatureUrl={null}
              employerSignatureUrl={null}
              employeeSigningMetadata={(contract as any).employee_signing_metadata as Record<string, any> | undefined}
              employerSigningMetadata={(contract as any).employer_signing_metadata as Record<string, any> | undefined}
            />
          </CardContent>
        </Card>

        {/* Step 2: Code of Conduct */}
        {!alreadySigned && !signed && (
          <Card className="shadow-md">
            <CardHeader className="bg-accent/30 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Step 2: Code of Conduct / Steg 2: Uppförandekod
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <p className="text-sm text-muted-foreground">
                Please review the Code of Conduct before signing. Select your preferred language. /
                <span className="italic"> Vänligen granska uppförandekoden innan du signerar. Välj önskat språk.</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {COC_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setCocLanguage(lang.code); setCocConfirmed(false); }}
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

              {selectedCocLang && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                      Document / Dokument — {selectedCocLang.label}
                    </label>
                  </div>

                  {(() => {
                    return (
                    <>
                      <CodeOfConductViewer language={cocLanguage!} />

                      {/* Warning banner when not yet confirmed */}
                      {!cocConfirmed && (
                        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            ⚠ You must confirm that you have read the Code of Conduct to proceed. /
                            <span className="italic font-normal"> Du måste bekräfta att du har läst uppförandekoden för att fortsätta.</span>
                          </p>
                        </div>
                      )}

                      {/* CoC confirmation toggle — always visible */}
                      <div
                        className={cn(
                          "w-full flex items-center gap-4 rounded-lg border-2 p-4 transition-all",
                          cocConfirmed
                            ? "border-primary bg-primary/10"
                            : "border-primary/50 bg-muted/20"
                        )}
                      >
                        <Switch
                          checked={cocConfirmed}
                          onCheckedChange={setCocConfirmed}
                          className="scale-125"
                        />
                        <span className={cn("text-sm font-medium", cocConfirmed && "text-primary")}>
                          {cocConfirmed ? "✓ " : ""}
                          I have read and understood the Code of Conduct. /
                          <span className="italic text-muted-foreground"> Jag har läst och förstått uppförandekoden.</span>
                        </span>
                      </div>
                    </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Schedule Appendix */}
        {!alreadySigned && !signed && hasSchedule && (
          <Card className="shadow-md">
            <CardHeader className="bg-accent/30 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Step 3: Schedule Appendix / Steg 3: Schemabilaga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {/* Summary */}
              {schedData && (
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
              )}

              {/* Payment Disclaimer */}
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-primary">Payment & Work Period Disclaimer / Betalnings- & arbetsperiodsinformation</p>
                    <p className="text-xs text-foreground/80">
                      Hourly compensation is only payable for hours actually worked during the defined <strong>work period</strong>.
                      Payment begins when the employee starts delivering work hours within the scheduled work period and ceases when the work period ends
                      (e.g. due to end of season, weather conditions, or other operational factors).
                      No hourly compensation is payable outside the active work period, including any off-season or pre-season contract period.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Timlön utbetalas endast för faktiskt arbetade timmar under den definierade arbetsperioden.
                      Betalning börjar när den anställde börjar leverera arbetstimmar inom den schemalagda arbetsperioden och upphör när arbetsperioden slutar
                      (t.ex. på grund av säsongens slut, väderförhållanden eller andra operativa faktorer).
                      Ingen timlön utbetalas utanför den aktiva arbetsperioden, inklusive eventuell lågsäsong eller tid före säsongen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable day-by-day schedule */}
              {schedule.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setScheduleExpanded(!scheduleExpanded)}
                    className="gap-2 w-full justify-between"
                  >
                    <span className="text-xs">
                      View full day-by-day schedule ({schedule.length} days) / Visa fullständigt dagschema ({schedule.length} dagar)
                    </span>
                    {scheduleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>

                  {scheduleExpanded && (
                    <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted">
                          <tr>
                            <th className="text-left p-2 font-semibold">Date / Datum</th>
                            <th className="text-left p-2 font-semibold">Day / Dag</th>
                            <th className="text-left p-2 font-semibold">Type / Typ</th>
                            <th className="text-right p-2 font-semibold">Hours / Timmar</th>
                            <th className="text-left p-2 font-semibold hidden sm:table-cell">Time / Tid</th>
                            <th className="text-left p-2 font-semibold hidden sm:table-cell">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.map((day) => {
                            const d = new Date(day.schedule_date + "T00:00:00");
                            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                            return (
                              <tr key={day.schedule_date} className={cn(
                                "border-t border-border hover:bg-muted/30",
                                day.day_type === "Weekend" && "bg-muted/40",
                                day.day_type === "Holiday" && "bg-destructive/5",
                                day.day_type === "Vacation" && "bg-primary/5",
                              )}>
                                <td className="p-2 font-mono">{day.schedule_date}</td>
                                <td className={cn("p-2", day.day_type === "Weekend" && "font-semibold")}>{dayName}</td>
                                <td className={cn("p-2 font-medium", dayTypeColor(day.day_type))}>
                                  {day.day_type}
                                </td>
                                <td className="p-2 text-right font-medium">
                                  {day.scheduled_hours > 0 ? `${day.scheduled_hours}h` : "—"}
                                </td>
                                <td className="p-2 hidden sm:table-cell text-muted-foreground">
                                  {day.start_time && day.end_time ? `${day.start_time}–${day.end_time}` : "—"}
                                </td>
                                <td className="p-2 hidden sm:table-cell text-muted-foreground">
                                  {day.holiday_name_en || ""}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`/schedule-view/${contractId}`, "_blank");
                    setScheduleReviewed(true);
                  }}
                  className="gap-2"
                >
                  Open Full Schedule / Öppna fullständigt schema
                </Button>
                {!scheduleReviewed && (
                  <Button variant="secondary" size="sm" onClick={() => setScheduleReviewed(true)} className="gap-2">
                    <Check className="w-4 h-4" />
                    Mark as reviewed / Markera som granskad
                  </Button>
                )}
              </div>
              {scheduleReviewed && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="w-3.5 h-3.5" /> Reviewed / Granskad
                </span>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Signing — only visible after CoC is confirmed (or already signed) */}
        {(cocConfirmed || signed || alreadySigned) && (
        <Card className="shadow-md">
          <CardHeader className="bg-accent/30 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              ✍️ {alreadySigned || signed ? "Signature / Underskrift" : "Step 4: Sign Contract / Steg 4: Signera avtal"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {signed || alreadySigned ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                <p className="text-lg font-semibold text-primary">Signed Successfully / Signerat framgångsrikt</p>
                <p className="text-sm text-muted-foreground">
                  The contract will now be sent to the employer for their signature. /
                  <span className="italic"> Avtalet skickas nu till arbetsgivaren för deras underskrift.</span>
                </p>
                <p className="text-xs text-muted-foreground mt-4">You can close this window. / Du kan stänga det här fönstret.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contract terms confirmation with Switch */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">
                    Confirmations / Bekräftelser
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-4 rounded-lg border-2 p-3 transition-all",
                      contractConfirmed
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/30 bg-background"
                    )}
                  >
                    <Switch
                      checked={contractConfirmed}
                      onCheckedChange={setContractConfirmed}
                      className="scale-125"
                    />
                    <span className={cn("text-sm font-medium", contractConfirmed && "text-primary")}>
                      {contractConfirmed ? "✓ " : ""}
                      I have read and agree to the terms of this employment contract and schedule. /
                      <span className="italic text-muted-foreground"> Jag har läst och godkänner villkoren i detta anställningsavtal och schema.</span>
                    </span>
                  </div>
                </div>

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

                {/* Missing steps checklist */}
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

                {canSign ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Draw your signature below to sign the contract. /
                      <span className="italic"> Rita din namnteckning nedan för att signera avtalet.</span>
                    </p>
                    <SignatureCanvas onSave={handleSign} disabled={submitting} />
                    {submitting && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting signature...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Complete the steps above to enable signing. / Slutför stegen ovan för att kunna signera.
                    </p>
                    <SignatureCanvas onSave={handleSign} disabled={true} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ljungan Forestry · Secure Digital Signing
          </p>
        </div>
      </div>
    </div>
  );
}
