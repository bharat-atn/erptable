import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/dashboard/SignatureCanvas";
import { ContractDocument } from "@/components/dashboard/ContractDocument";
import {
  CheckCircle, Loader2, AlertTriangle, FileText, Check, ExternalLink,
  Calendar, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/ljungan-forestry-logo.png";

const COC_LANGUAGES = [
  { code: "sv", label: "Svenska", labelEn: "Swedish", file: "/documents/code-of-conduct-sv.pdf" },
  { code: "en", label: "English", labelEn: "English", file: "/documents/code-of-conduct-en.pdf" },
  { code: "ro", label: "Română", labelEn: "Romanian", file: "/documents/code-of-conduct-ro.pdf" },
  { code: "th", label: "ไทย", labelEn: "Thai", file: "/documents/code-of-conduct-th.pdf" },
];

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

  // Review states
  const [cocLanguage, setCocLanguage] = useState<string | null>(null);
  const [cocReviewed, setCocReviewed] = useState(false);
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
        .select("id, contract_code, season_year, signing_status, signing_token, employee_signature_url, employer_signature_url, form_data, company_id")
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
      if (sched) setSchedule(sched);

      setLoading(false);
    };
    load();
  }, [contractId]);

  const handleSign = async (dataUrl: string) => {
    if (!contract?.signing_token) return;
    setSubmitting(true);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filePath = `employee/${contract.id}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("signatures")
        .upload(filePath, blob, { upsert: true, contentType: "image/png" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(filePath);

      const { error: rpcErr } = await supabase.rpc("submit_employee_signature", {
        _token: contract.signing_token,
        _signature_url: urlData.publicUrl,
      });
      if (rpcErr) throw rpcErr;
      setSigned(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit signature");
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
  const canSign = cocReviewed && cocConfirmed && contractConfirmed && (scheduleReviewed || !hasSchedule);

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
                    onClick={() => { setCocLanguage(lang.code); setCocReviewed(false); setCocConfirmed(false); }}
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
                    {cocLanguage === lang.code && <Check className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>

              {selectedCocLang && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                      Document / Dokument
                    </label>
                    {cocReviewed && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Check className="w-3.5 h-3.5" /> Reviewed / Granskad
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-6 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="text-sm font-medium text-center">Code of Conduct — {selectedCocLang.label}</p>
                    <p className="text-xs text-muted-foreground text-center">{selectedCocLang.file.split("/").pop()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { window.open(selectedCocLang.file, "_blank"); setCocReviewed(true); }}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open & Review / Öppna & granska
                    </Button>
                    {!cocReviewed && (
                      <Button variant="secondary" size="sm" onClick={() => setCocReviewed(true)} className="gap-2">
                        <Check className="w-4 h-4" />
                        Mark as reviewed / Markera som granskad
                      </Button>
                    )}
                  </div>
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
                              <tr key={day.schedule_date} className="border-t border-border hover:bg-muted/30">
                                <td className="p-2 font-mono">{day.schedule_date}</td>
                                <td className="p-2">{dayName}</td>
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
                  <ExternalLink className="w-4 h-4" />
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

        {/* Step 4: Signing */}
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
                  <label
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => cocReviewed ? setCocConfirmed(!cocConfirmed) : null}
                  >
                    <div className={cn(
                      "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      cocConfirmed ? "border-primary bg-primary" : "border-muted-foreground/40",
                      !cocReviewed && "opacity-50 cursor-not-allowed"
                    )}>
                      {cocConfirmed && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={cn("text-sm", !cocReviewed && "opacity-50")}>
                      I have read and understood the Code of Conduct. /
                      <span className="italic text-muted-foreground"> Jag har läst och förstått uppförandekoden.</span>
                      {!cocReviewed && (
                        <span className="block text-xs text-destructive mt-1">
                          Please review the Code of Conduct above first. / Vänligen granska uppförandekoden ovan först.
                        </span>
                      )}
                    </span>
                  </label>
                </div>

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
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please complete all review steps and confirm both checkboxes above to enable signing. /
                      <span className="italic"> Slutför alla granskningssteg och bekräfta båda kryssrutorna ovan för att aktivera signering.</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
