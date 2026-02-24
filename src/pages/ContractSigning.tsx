import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/dashboard/SignatureCanvas";
import { ContractDocument } from "@/components/dashboard/ContractDocument";
import { CheckCircle, Loader2, AlertTriangle, FileText, Check, ExternalLink, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/ljungan-forestry-logo.png";

const PUBLISHED_ORIGIN = "https://erptable.lovable.app";

const COC_LANGUAGES = [
  { code: "sv", label: "Svenska", labelEn: "Swedish", file: "/documents/code-of-conduct-sv.pdf" },
  { code: "en", label: "English", labelEn: "English", file: "/documents/code-of-conduct-en.pdf" },
  { code: "ro", label: "Română", labelEn: "Romanian", file: "/documents/code-of-conduct-ro.pdf" },
  { code: "th", label: "ไทย", labelEn: "Thai", file: "/documents/code-of-conduct-th.pdf" },
];

// ... keep existing code (SigningData interface)
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
  const [cocReviewed, setCocReviewed] = useState(false);
  const [cocConfirmed, setCocConfirmed] = useState(false);
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [scheduleReviewed, setScheduleReviewed] = useState(false);

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

  const handleSign = async (dataUrl: string) => {
    if (!token || !data) return;
    setSubmitting(true);

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filePath = `employee/${data.contract_id}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("signatures")
        .upload(filePath, blob, { upsert: true, contentType: "image/png" });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(filePath);

      const { error: rpcErr } = await supabase.rpc("submit_employee_signature", {
        _token: token,
        _signature_url: urlData.publicUrl,
      });

      if (rpcErr) throw rpcErr;
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
  const fd = data.form_data || {};
  const selectedCocLang = COC_LANGUAGES.find((l) => l.code === cocLanguage);
  const schedData = fd.schedulingData as Record<string, any> | undefined;
  const canSign = cocReviewed && cocConfirmed && contractConfirmed && (scheduleReviewed || !schedData);

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8 safe-area-top safe-area-bottom">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <img src={logoImg} alt="Logo" className="h-10 sm:h-12 mx-auto" />
        </div>

        {/* Full Contract Document */}
        <Card className="shadow-md overflow-hidden">
          <CardContent className="p-0">
            <ContractDocument
              companyName={data.company_name}
              companyOrgNumber={data.company_org_number}
              companyAddress={data.company_address}
              companyPostcode={data.company_postcode}
              companyCity={data.company_city}
              contractCode={data.contract_code}
              seasonYear={data.season_year}
              formData={fd}
              employeeSignatureUrl={null}
              employerSignatureUrl={null}
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
                    {cocLanguage === lang.code && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
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
                    {cocReviewed && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Check className="w-3.5 h-3.5" />
                        Reviewed / Granskad
                      </span>
                    )}
                  </div>
                  {/* Embedded PDF viewer */}
                  <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                    <object
                      data={`${selectedCocLang.file}#toolbar=1&navpanes=0`}
                      type="application/pdf"
                      className="w-full h-[400px] sm:h-[500px]"
                      title={`Code of Conduct - ${selectedCocLang.label}`}
                      onLoad={() => setCocReviewed(true)}
                    >
                      <iframe
                        src={`https://docs.google.com/gview?embedded=true&url=${PUBLISHED_ORIGIN}${selectedCocLang.file}`}
                        className="w-full h-[400px] sm:h-[500px]"
                        title={`Code of Conduct - ${selectedCocLang.label}`}
                        onLoad={() => setCocReviewed(true)}
                      />
                    </object>
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
                    {!cocReviewed && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCocReviewed(true)}
                        className="gap-2"
                      >
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

        {/* Schedule Appendix Review */}
        {!alreadySigned && !signed && schedData && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule Appendix / Schemabilaga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              {/* Inline schedule summary */}
              <div className="rounded-lg border border-border overflow-hidden bg-background">
                <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto p-4">
                  <p className="text-xs text-muted-foreground mb-3 italic">
                    Detailed schedule overview based on contracted period. / Detaljerad schemaöversikt baserad på avtalsperioden.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Season Year / Säsongsår</span>
                      <p className="font-medium">{schedData.seasonYear || data.season_year || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Weekly Hours / Veckotimmar</span>
                      <p className="font-medium">{schedData.weeklyHours || 40}h</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Work Hours / Arbetstider</span>
                      <p className="font-medium">{schedData.startTime || "06:30"} – {schedData.endTime || "17:00"}</p>
                    </div>
                    {schedData.vacationEnabled && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Vacation / Semester</span>
                        <p className="font-medium">{schedData.vacationStartDate || "—"} → {schedData.vacationEndDate || "—"}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
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

        {/* Signing Area */}
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

                {/* Signature canvas - only enabled when both confirmations are checked */}
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

                {canSign ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Draw your signature below to sign the contract. /
                      <span className="italic"> Rita din namnteckning nedan för att signera avtalet.</span>
                    </p>
                    <SignatureCanvas onSave={handleSign} disabled={submitting} />
                    {submitting && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting signature...
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please review the Code of Conduct and confirm both checkboxes above to enable signing. /
                      <span className="italic"> Granska uppförandekoden och bekräfta båda kryssrutorna ovan för att aktivera signering.</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
