import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Folder, AlertTriangle, CheckCircle2 } from "lucide-react";
import ljunganLogo from "@/assets/ljungan-forestry-logo.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_BANKS = [
  "BANCA TRANSILVANIA S.A.",
  "Banca Comercială Română S.A.",
  "BRD - Groupe Société Générale S.A.",
  "CEC BANK S.A.",
  "ING Bank NV, Amsterdam - Bucharest Branch",
  "UniCredit Bank S.A.",
  "RAIFFEISEN BANK S.A.",
];

const COUNTRIES = [
  "Romania", "USA", "Germany", "France", "Italy", "Spain", "UK", "Netherlands",
  "Belgium", "Austria", "Poland", "Sweden", "Norway", "Denmark", "Finland",
  "Hungary", "Czech Republic", "Portugal", "Greece", "Ireland"
];

/* ─── Date validation helpers ─── */
const today = new Date();
const MIN_AGE = 16;
const MAX_AGE = 80;
const minBirthYear = today.getFullYear() - MAX_AGE;
const maxBirthYear = today.getFullYear() - MIN_AGE;

function isBirthdayReasonable(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  return year >= minBirthYear && year <= maxBirthYear;
}

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, "Last name is required").max(100),
  preferredName: z.string().min(1, "Preferred name is required").max(100),
  address1: z.string().min(1, "Address is required").max(500),
  address2: z.string().max(500).optional(),
  zipCode: z.string().min(1, "ZIP/Postal code is required").max(20),
  city: z.string().min(1, "City is required").max(100),
  stateProvince: z.string().min(1, "State/Province is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  birthday: z.string().min(1, "Birthday is required").refine(isBirthdayReasonable, {
    message: `Birthday must be between ${minBirthYear} and ${maxBirthYear}`,
  }),
  countryOfBirth: z.string().min(1, "Country of birth is required"),
  citizenship: z.string().min(1, "Citizenship is required"),
  mobilePhone: z.string().min(10, "Valid phone number required").max(20),
  email: z.string().email("Valid email required"),
  bankName: z.string().min(1, "Bank is required"),
  otherBankName: z.string().max(200).optional(),
  bicCode: z.string().min(1, "BIC Code is required").max(20),
  bankAccountNumber: z.string().min(1, "Bank account number is required").max(50),
  emergencyFirstName: z.string().min(1, "Emergency contact first name is required").max(100),
  emergencyLastName: z.string().min(1, "Emergency contact last name is required").max(100),
  emergencyPhone: z.string().min(10, "Valid phone number required").max(20),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;

interface LogoSettings {
  dataUrl: string;
  size: number;
  padding: number;
}

function loadTemplateLogo(): LogoSettings | null {
  try {
    const saved = localStorage.getItem("invitation-template-logo-v2");
    if (saved) return JSON.parse(saved);
    const old = localStorage.getItem("invitation-template-logo");
    if (old) return { dataUrl: old, size: 100, padding: 16 };
    return null;
  } catch { return null; }
}

interface OnboardingWizardProps {
  formData: Partial<PersonalInfo>;
  updateField: (field: keyof PersonalInfo, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  isPreview?: boolean;
  selectedBank: string;
  isOtherBank: boolean;
  onBankSelect: (bank: string) => void;
  uploadedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  workPermitFile?: File | null;
  onWorkPermitFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/* ─── Reusable label matching contract wizard ─── */
function FieldLabel({ en, sv, required = true }: { en: string; sv: string; required?: boolean }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
      {en} / {sv}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

/* ─── Section header matching contract wizard exactly ─── */
function SectionHeader({
  number,
  titleEn,
  titleSv,
  open,
  onToggle,
  missingFields = [],
  showValidation = false,
}: {
  number?: string;
  titleEn: string;
  titleSv: string;
  open: boolean;
  onToggle: () => void;
  missingFields?: string[];
  showValidation?: boolean;
}) {
  const hasWarning = showValidation && missingFields.length > 0;
  const isComplete = showValidation && missingFields.length === 0;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between rounded-full border px-5 sm:px-6 py-3 text-sm font-semibold transition-colors",
          hasWarning
            ? "border-destructive/50 bg-destructive/5 text-primary"
            : isComplete
              ? "border-success/50 bg-success/5 text-primary"
              : "border-primary bg-primary/5 text-primary"
        )}
      >
        <span className="flex items-center gap-2 text-left">
          {hasWarning && (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          )}
          {isComplete && (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          )}
          <span className="leading-tight">
            {number
              ? `Section ${number}: ${titleEn} / Sektion ${number}: ${titleSv}`
              : `${titleEn} / ${titleSv}`
            }
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200 ml-2",
            open && "rotate-180"
          )}
        />
      </button>
      {hasWarning && !open && (
        <p className="text-[11px] text-destructive pl-6">
          Missing: {missingFields.join(", ")}
        </p>
      )}
    </div>
  );
}

export function OnboardingWizard({
  formData,
  updateField,
  onSubmit,
  isSubmitting = false,
  isPreview = false,
  selectedBank,
  isOtherBank,
  onBankSelect,
  uploadedFile,
  onFileChange,
  workPermitFile,
  onWorkPermitFileChange,
}: OnboardingWizardProps) {
  const templateLogo = loadTemplateLogo();
  const [bankList, setBankList] = useState<string[]>(FALLBACK_BANKS);

  useEffect(() => {
    supabase
      .from("banks")
      .select("name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBankList(data.map((b: any) => b.name));
        }
      });
  }, []);
  const [s1Open, setS1Open] = useState(true);
  const [s2Open, setS2Open] = useState(true);
  const [s3Open, setS3Open] = useState(true);
  const [s4Open, setS4Open] = useState(true);
  const [s5Open, setS5Open] = useState(true);
  const [validationAttempted, setValidationAttempted] = useState(false);

  /* ─── Validation: compute missing fields per section ─── */
  const s1Missing: string[] = [];
  if (!formData.firstName) s1Missing.push("First Name");
  if (!formData.lastName) s1Missing.push("Last Name");
  if (!formData.preferredName) s1Missing.push("Preferred Name");
  if (!formData.address1) s1Missing.push("Address 1");
  if (!formData.zipCode) s1Missing.push("ZIP / Postal Code");
  if (!formData.city) s1Missing.push("City");
  if (!formData.stateProvince) s1Missing.push("State / Province");
  if (!formData.country) s1Missing.push("Country");

  const s2Missing: string[] = [];
  if (!formData.birthday) {
    s2Missing.push("Birthday");
  } else if (!isBirthdayReasonable(formData.birthday)) {
    s2Missing.push(`Birthday (must be ${minBirthYear}–${maxBirthYear})`);
  }
  if (!formData.countryOfBirth) s2Missing.push("Country of Birth");
  if (!formData.citizenship) s2Missing.push("Citizenship");
  if (!formData.mobilePhone) s2Missing.push("Mobile Phone");
  else if (formData.mobilePhone.length < 10) s2Missing.push("Mobile Phone (min 10 digits)");
  if (!formData.email) s2Missing.push("Email");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) s2Missing.push("Email (invalid format)");

  const s3Missing: string[] = [];
  if (!formData.emergencyFirstName) s3Missing.push("First Name");
  if (!formData.emergencyLastName) s3Missing.push("Last Name");
  if (!formData.emergencyPhone) s3Missing.push("Mobile Phone");
  else if (formData.emergencyPhone.length < 10) s3Missing.push("Mobile Phone (min 10 digits)");

  const s4Missing: string[] = [];
  if (!selectedBank && !isOtherBank) s4Missing.push("Bank Selection");
  if (isOtherBank && !formData.otherBankName) s4Missing.push("Bank Name");
  if (!formData.bicCode) s4Missing.push("BIC Code");
  if (!formData.bankAccountNumber) s4Missing.push("Account Number");

  const s5Missing: string[] = [];
  if (!uploadedFile) s5Missing.push("ID / Passport Document");

  const totalMissing = s1Missing.length + s2Missing.length + s3Missing.length + s4Missing.length + s5Missing.length;
  const allComplete = totalMissing === 0;

  /* ─── Enhanced submit handler with validation ─── */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAttempted(true);

    if (!allComplete) {
      // Open sections that have issues
      if (s1Missing.length > 0) setS1Open(true);
      if (s2Missing.length > 0) setS2Open(true);
      if (s3Missing.length > 0) setS3Open(true);
      if (s4Missing.length > 0) setS4Open(true);
      if (s5Missing.length > 0) setS5Open(true);

      toast.error(
        `Please complete all required fields. ${totalMissing} field${totalMissing > 1 ? "s" : ""} remaining.`,
        { duration: 5000 }
      );
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // All fields valid — call parent onSubmit
    onSubmit(e);
  };

  /* ─── Field error styling helper ─── */
  const fieldError = (hasError: boolean) =>
    validationAttempted && hasError ? "border-destructive focus-visible:ring-destructive/30" : "";

  return (
    <div className="min-h-screen bg-background overflow-y-auto safe-area-top safe-area-bottom">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-5">
          {templateLogo ? (
            <div style={{ padding: `${templateLogo.padding}px` }}>
              <img
                src={templateLogo.dataUrl}
                alt="Company Logo"
                className="object-contain mb-1"
                style={{ width: `${templateLogo.size}px` }}
              />
            </div>
          ) : (
            <>
              <img
                src={ljunganLogo}
                alt="Ljungan Forestry"
                className="w-16 h-16 sm:w-20 sm:h-20 mb-1 object-contain"
              />
              <span className="font-bold text-primary text-base sm:text-lg tracking-widest uppercase">
                Ljungan Forestry
              </span>
            </>
          )}
        </div>

        <p className="text-center text-primary font-semibold text-sm sm:text-base mb-6">
          Please fill out the following information in full / Vänligen fyll i följande information fullständigt
        </p>

        {isPreview && (
          <div className="text-center mb-5">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              Preview Mode
            </span>
          </div>
        )}

        {/* Validation summary banner */}
        {validationAttempted && !allComplete && (
          <div className="mb-5 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-destructive">
                Form incomplete — {totalMissing} required field{totalMissing > 1 ? "s" : ""} missing
              </p>
              <p className="text-xs text-destructive/70 mt-1">
                Please review each section marked with ⚠️ and fill in all required fields before submitting.
              </p>
            </div>
          </div>
        )}

        {validationAttempted && allComplete && (
          <div className="mb-5 rounded-lg border-2 border-success/30 bg-success/5 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-success">
                All fields completed — ready to submit!
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">

          {/* ═══ Section 2.1: Name and Address ═══ */}
          <Collapsible open={s1Open} onOpenChange={setS1Open}>
            <SectionHeader
              number="2.1"
              titleEn="Name and Address Information"
              titleSv="Namn och Adressinformation"
              open={s1Open}
              onToggle={() => setS1Open(!s1Open)}
              missingFields={s1Missing}
              showValidation={validationAttempted}
            />
            <CollapsibleContent className="pt-5 pb-2 px-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <FieldLabel en="First Name" sv="Förnamn" />
                  <Input value={formData.firstName || ""} onChange={(e) => updateField("firstName", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.firstName))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Middle Name" sv="Mellannamn" required={false} />
                  <Input value={formData.middleName || ""} onChange={(e) => updateField("middleName", e.target.value)} className="h-11 text-sm font-medium" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Last Name" sv="Efternamn" />
                  <Input value={formData.lastName || ""} onChange={(e) => updateField("lastName", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.lastName))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Preferred Name" sv="Tilltalsnamn" />
                  <Input value={formData.preferredName || ""} onChange={(e) => updateField("preferredName", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.preferredName))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Address 1" sv="Adress 1" />
                  <Input value={formData.address1 || ""} onChange={(e) => updateField("address1", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.address1))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Address 2" sv="Adress 2" required={false} />
                  <Input value={formData.address2 || ""} onChange={(e) => updateField("address2", e.target.value)} className="h-11 text-sm font-medium" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="ZIP / Postal Code" sv="Postnummer" />
                  <Input value={formData.zipCode || ""} onChange={(e) => updateField("zipCode", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.zipCode))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="City" sv="Ort" />
                  <Input value={formData.city || ""} onChange={(e) => updateField("city", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.city))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="State / Province" sv="Län / Region" />
                  <Input value={formData.stateProvince || ""} onChange={(e) => updateField("stateProvince", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.stateProvince))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Country" sv="Land" />
                  <Select value={formData.country} onValueChange={(v) => updateField("country", v)}>
                    <SelectTrigger className={cn("h-11 text-sm font-medium", fieldError(!formData.country))}><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ═══ Section 2.2: Birth and Contact Information ═══ */}
          <Collapsible open={s2Open} onOpenChange={setS2Open}>
            <SectionHeader
              number="2.2"
              titleEn="Birth and Contact Information"
              titleSv="Födelse- och Kontaktinformation"
              open={s2Open}
              onToggle={() => setS2Open(!s2Open)}
              missingFields={s2Missing}
              showValidation={validationAttempted}
            />
            <CollapsibleContent className="pt-5 pb-2 px-1 space-y-4">
              <div className="space-y-1.5">
                <FieldLabel en="Birthday" sv="Födelsedag" />
                <Input
                  type="date"
                  value={formData.birthday || ""}
                  onChange={(e) => updateField("birthday", e.target.value)}
                  min={`${minBirthYear}-01-01`}
                  max={`${maxBirthYear}-12-31`}
                  className={cn("h-11 text-sm font-medium", fieldError(!formData.birthday || !isBirthdayReasonable(formData.birthday || "")))}
                />
                {formData.birthday && !isBirthdayReasonable(formData.birthday) && (
                  <p className="text-[11px] text-destructive">
                    Age must be between {MIN_AGE} and {MAX_AGE} years old
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <FieldLabel en="Country of Birth" sv="Födelseland" />
                  <Select value={formData.countryOfBirth} onValueChange={(v) => updateField("countryOfBirth", v)}>
                    <SelectTrigger className={cn("h-11 text-sm font-medium", fieldError(!formData.countryOfBirth))}><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Citizenship" sv="Medborgarskap" />
                  <Select value={formData.citizenship} onValueChange={(v) => updateField("citizenship", v)}>
                    <SelectTrigger className={cn("h-11 text-sm font-medium", fieldError(!formData.citizenship))}><SelectValue placeholder="Select citizenship" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel en="Mobile Phone Number" sv="Mobiltelefon" />
                <div className="flex gap-2">
                  <Select defaultValue="RO">
                    <SelectTrigger className="w-24 h-11 text-sm font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RO">🇷🇴 +40</SelectItem>
                      <SelectItem value="US">🇺🇸 +1</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="SE">🇸🇪 +46</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={formData.mobilePhone || ""}
                    onChange={(e) => updateField("mobilePhone", e.target.value)}
                    className={cn("flex-1 h-11 text-sm font-medium", fieldError(!formData.mobilePhone || formData.mobilePhone.length < 10))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel en="Email" sv="E-post" />
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={cn("h-11 text-sm font-medium", fieldError(!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || "")))}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ═══ Section 2.3: Emergency Contact ═══ */}
          <Collapsible open={s3Open} onOpenChange={setS3Open}>
            <SectionHeader
              number="2.3"
              titleEn="Emergency Contact Information"
              titleSv="Nödkontaktinformation"
              open={s3Open}
              onToggle={() => setS3Open(!s3Open)}
              missingFields={s3Missing}
              showValidation={validationAttempted}
            />
            <CollapsibleContent className="pt-5 pb-2 px-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <FieldLabel en="Emergency Contact First Name" sv="Förnamn" />
                  <Input value={formData.emergencyFirstName || ""} onChange={(e) => updateField("emergencyFirstName", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.emergencyFirstName))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Emergency Contact Last Name" sv="Efternamn" />
                  <Input value={formData.emergencyLastName || ""} onChange={(e) => updateField("emergencyLastName", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.emergencyLastName))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel en="Emergency Contact Mobile Phone" sv="Mobiltelefon" />
                <div className="flex gap-2">
                  <Select defaultValue="RO">
                    <SelectTrigger className="w-24 h-11 text-sm font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RO">🇷🇴 +40</SelectItem>
                      <SelectItem value="US">🇺🇸 +1</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="SE">🇸🇪 +46</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={formData.emergencyPhone || ""}
                    onChange={(e) => updateField("emergencyPhone", e.target.value)}
                    className={cn("flex-1 h-11 text-sm font-medium", fieldError(!formData.emergencyPhone || formData.emergencyPhone.length < 10))}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ═══ Section 3: Bank Information ═══ */}
          <Collapsible open={s4Open} onOpenChange={setS4Open}>
            <SectionHeader
              titleEn="Bank Information"
              titleSv="Bankinformation"
              open={s4Open}
              onToggle={() => setS4Open(!s4Open)}
              missingFields={s4Missing}
              showValidation={validationAttempted}
            />
            <CollapsibleContent className="pt-5 pb-2 px-1 space-y-4">
              <div className="space-y-3">
                <FieldLabel en="Toggle your Bank" sv="Välj din bank" />
                <RadioGroup
                  value={isOtherBank ? "other" : selectedBank}
                  onValueChange={onBankSelect}
                  className="space-y-2"
                >
                  {bankList.map((bank) => (
                    <div key={bank} className="flex items-center space-x-2.5 min-h-[44px]">
                      <RadioGroupItem value={bank} id={bank} className="shrink-0" />
                      <Label htmlFor={bank} className="font-normal cursor-pointer text-sm text-primary">{bank}</Label>
                    </div>
                  ))}
                  <div className="pt-3 mt-2 border-t border-border">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2 block">
                      Toggle here if your bank is not in the list above / Välj här om din bank inte finns i listan ovan
                    </label>
                    <div className="flex items-center space-x-2.5 min-h-[44px]">
                      <RadioGroupItem value="other" id="other-bank" className="shrink-0" />
                      <Label htmlFor="other-bank" className="font-normal cursor-pointer text-sm">Other Bank / Annan bank</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              {isOtherBank && (
                <div className="space-y-1.5">
                  <FieldLabel en="Bank Name" sv="Banknamn" />
                  <Input value={formData.otherBankName || ""} onChange={(e) => updateField("otherBankName", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(isOtherBank && !formData.otherBankName))} />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <FieldLabel en="BIC Code" sv="BIC-kod" />
                  <Input value={formData.bicCode || ""} onChange={(e) => updateField("bicCode", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.bicCode))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Bank Account Number" sv="Kontonummer" />
                  <Input value={formData.bankAccountNumber || ""} onChange={(e) => updateField("bankAccountNumber", e.target.value)} className={cn("h-11 text-sm font-medium", fieldError(!formData.bankAccountNumber))} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ═══ Section 4: ID / Passport & Work Permit ═══ */}
          <Collapsible open={s5Open} onOpenChange={setS5Open}>
            <SectionHeader
              titleEn="ID / Passport & Work Permit Information"
              titleSv="ID- / Pass- och arbetstillståndsinformation"
              open={s5Open}
              onToggle={() => setS5Open(!s5Open)}
              missingFields={s5Missing}
              showValidation={validationAttempted}
            />
            <CollapsibleContent className="pt-5 pb-2 px-1 space-y-6">
              {/* ID / Passport upload (required) */}
              <div className="space-y-3">
                <FieldLabel en="Please attach your valid EU ID or Passport" sv="Bifoga ditt giltiga EU-ID eller pass" />
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer",
                  validationAttempted && !uploadedFile ? "border-destructive/50 bg-destructive/5" : "border-muted-foreground/30"
                )}>
                  <input type="file" id="id-upload" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
                  <label htmlFor="id-upload" className="cursor-pointer block">
                    <Folder className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a file or <span className="text-primary font-semibold underline">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Accepted formats: JPG, PNG, PDF
                    </p>
                    {uploadedFile && (
                      <p className="mt-3 text-sm text-primary font-semibold">{uploadedFile.name}</p>
                    )}
                  </label>
                </div>
              </div>

              {/* Working Visa / Work Permit upload (optional) */}
              <div className="space-y-3">
                <FieldLabel
                  en="If applicable, please attach your Swedish Work Permit / Working Visa"
                  sv="Om tillämpligt, bifoga ditt svenska arbetstillstånd / arbetsvisum"
                  required={false}
                />
                <p className="text-xs text-muted-foreground/70 -mt-1">(Optional / Valfritt)</p>
                <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer border-muted-foreground/30">
                  <input type="file" id="work-permit-upload" accept="image/*,.pdf" onChange={onWorkPermitFileChange} className="hidden" />
                  <label htmlFor="work-permit-upload" className="cursor-pointer block">
                    <Folder className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a file or <span className="text-primary font-semibold underline">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Accepted formats: JPG, PNG, PDF
                    </p>
                    {workPermitFile && (
                      <p className="mt-3 text-sm text-primary font-semibold">{workPermitFile.name}</p>
                    )}
                  </label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit */}
          <div className="flex justify-center pt-4 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className={cn(
                "w-full sm:w-auto px-12 py-3 font-bold text-base rounded-full shadow-md min-h-[48px]",
                isPreview && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Submitting... / Skickar..." : "Submit this form / Skicka formuläret"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
