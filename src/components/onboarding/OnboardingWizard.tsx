import { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Folder, AlertTriangle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
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
import { countries, findCountryByName } from "@/lib/countries";
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

const COUNTRY_NAMES = countries.map(c => c.name);

/* ─── Priority countries for phone prefix dropdowns ─── */
const PRIORITY_COUNTRY_CODES = ["RO", "TH", "SE"];
const priorityCountries = countries.filter(c => PRIORITY_COUNTRY_CODES.includes(c.code));
const otherCountries = countries.filter(c => !PRIORITY_COUNTRY_CODES.includes(c.code));

/* ─── Priority country names for country selectors ─── */
const PRIORITY_COUNTRY_NAMES = ["Romania", "Thailand", "Sweden"];
const priorityCountryNames = COUNTRY_NAMES.filter(n => PRIORITY_COUNTRY_NAMES.includes(n));
const otherCountryNames = COUNTRY_NAMES.filter(n => !PRIORITY_COUNTRY_NAMES.includes(n));

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

/* ─── Phone digit extraction helper ─── */
function extractPhoneDigits(phone: string): string {
  return (phone || "").replace(/^\+[\d-]+\s*/, "").replace(/\D/g, "");
}

function getPhonePrefix(phone: string): string {
  return phone?.match(/^\+[\d-]+/)?.[0] || "";
}

/* ─── Country-aware phone length rules ─── */
const PHONE_LENGTH_RULES: Record<string, { min: number; max: number; placeholder: string }> = {
  "+46": { min: 7, max: 9, placeholder: "7XXXXXXXX (7-9 digits)" },     // Sweden
  "+40": { min: 9, max: 10, placeholder: "7XXXXXXXX (9-10 digits)" },    // Romania
  "+66": { min: 8, max: 9, placeholder: "8XXXXXXXX (8-9 digits)" },      // Thailand
  "+373": { min: 8, max: 8, placeholder: "XXXXXXXX (8 digits)" },        // Moldova
};
const DEFAULT_PHONE_RULE = { min: 4, max: 15, placeholder: "Phone number" };

function getPhoneRule(phone: string) {
  const prefix = getPhonePrefix(phone);
  return PHONE_LENGTH_RULES[prefix] || DEFAULT_PHONE_RULE;
}

function isPhoneValid(phone: string): boolean {
  const digits = extractPhoneDigits(phone);
  const rule = getPhoneRule(phone);
  return digits.length >= rule.min && digits.length <= rule.max;
}

function isPhoneTooLong(phone: string): boolean {
  const digits = extractPhoneDigits(phone);
  const rule = getPhoneRule(phone);
  return digits.length > rule.max;
}

function getPhoneMaxDigits(phone: string): number {
  return getPhoneRule(phone).max;
}

function isBankAccountValid(account: string): boolean {
  if (!account) return false;
  return /^\d+$/.test(account);
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
  mobilePhone: z.string().min(1, "Phone number is required").refine(
    (val) => isPhoneValid(val),
    { message: "Phone number length is invalid for the selected country prefix" }
  ),
  email: z.string().email("Valid email required"),
  bankName: z.string().min(1, "Bank is required"),
  otherBankName: z.string().max(200).optional(),
  bicCode: z.string().min(1, "BIC Code is required").max(20),
  bankAccountNumber: z.string().min(1, "Bank account number is required").max(50).refine(
    (val) => /^\d+$/.test(val),
    { message: "Bank account number must contain only digits" }
  ),
  emergencyFirstName: z.string().min(1, "Emergency contact first name is required").max(100),
  emergencyLastName: z.string().min(1, "Emergency contact last name is required").max(100),
  emergencyPhone: z.string().min(1, "Emergency phone is required").refine(
    (val) => isPhoneValid(val),
    { message: "Phone number length is invalid for the selected country prefix" }
  ),
  swedishCoordinationNumber: z.string().max(13).optional().refine(
    (val) => !val || /^\d{8}-?\d{4}$/.test(val),
    { message: "Must be exactly 12 digits (YYYYMMDD-XXXX)" }
  ),
  swedishPersonalNumber: z.string().max(13).optional().refine(
    (val) => !val || /^\d{8}-?\d{4}$/.test(val),
    { message: "Must be exactly 12 digits (YYYYMMDD-XXXX)" }
  ),
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

export type OnboardingLanguage = "sv" | "en" | "en_sv" | "ro_en" | "th_en";

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
  language?: OnboardingLanguage;
  showAiFill?: boolean;
  onAiFill?: (data: Record<string, any>) => void;
}

/* ─── Language label maps ─── */
const LANG_LABELS: Record<string, Record<string, string>> = {
  ro: {
    "First Name": "Prenume", "Middle Name": "Nume mijlociu", "Last Name": "Nume de familie",
    "Preferred Name": "Nume preferat", "Address 1": "Adresa 1", "Address 2": "Adresa 2",
    "ZIP / Postal Code": "Cod poștal", "City": "Oraș", "State / Province": "Stat / Județ",
    "Country": "Țara", "Date of Birth": "Data nașterii", "Country of Birth": "Țara nașterii",
    "Citizenship": "Cetățenie", "Mobile Phone": "Telefon mobil", "Email": "Email",
    "Swedish Personal Number": "Număr personal suedez", "Swedish Coordination Number": "Număr de coordonare suedez",
    "Emergency Contact – First Name": "Contact de urgență – Prenume", "Emergency Contact – Last Name": "Contact de urgență – Nume",
    "Emergency Contact – Mobile Phone": "Contact de urgență – Telefon",
    "Select Country": "Selectați țara", "Toggle your Bank": "Alegeți banca",
    "Bank Name": "Numele băncii", "BIC Code": "Cod BIC", "Bank Account Number": "Număr de cont bancar",
    "ID / Passport Document": "Document ID / Pașaport", "Work Permit Document": "Permis de muncă",
  },
  th: {
    "First Name": "ชื่อจริง", "Middle Name": "ชื่อกลาง", "Last Name": "นามสกุล",
    "Preferred Name": "ชื่อเล่น", "Address 1": "ที่อยู่ 1", "Address 2": "ที่อยู่ 2",
    "ZIP / Postal Code": "รหัสไปรษณีย์", "City": "เมือง", "State / Province": "จังหวัด",
    "Country": "ประเทศ", "Date of Birth": "วันเกิด", "Country of Birth": "ประเทศที่เกิด",
    "Citizenship": "สัญชาติ", "Mobile Phone": "โทรศัพท์มือถือ", "Email": "อีเมล",
    "Swedish Personal Number": "เลขประจำตัวสวีเดน", "Swedish Coordination Number": "เลขประสานงานสวีเดน",
    "Emergency Contact – First Name": "ผู้ติดต่อฉุกเฉิน – ชื่อ", "Emergency Contact – Last Name": "ผู้ติดต่อฉุกเฉิน – นามสกุล",
    "Emergency Contact – Mobile Phone": "ผู้ติดต่อฉุกเฉิน – โทรศัพท์",
    "Select Country": "เลือกประเทศ", "Toggle your Bank": "เลือกธนาคาร",
    "Bank Name": "ชื่อธนาคาร", "BIC Code": "รหัส BIC", "Bank Account Number": "หมายเลขบัญชีธนาคาร",
    "ID / Passport Document": "เอกสาร ID / หนังสือเดินทาง", "Work Permit Document": "เอกสารใบอนุญาตทำงาน",
  },
  sv: {
    "First Name": "Förnamn", "Middle Name": "Mellannamn", "Last Name": "Efternamn",
    "Preferred Name": "Tilltalnamn", "Address 1": "Adress 1", "Address 2": "Adress 2",
    "ZIP / Postal Code": "Postnummer", "City": "Ort", "State / Province": "Län / Region",
    "Country": "Land", "Date of Birth": "Födelsedatum", "Country of Birth": "Födelseland",
    "Citizenship": "Medborgarskap", "Mobile Phone": "Mobiltelefon", "Email": "E-post",
    "Swedish Personal Number": "Svenskt personnummer", "Swedish Coordination Number": "Samordningsnummer",
    "Emergency Contact – First Name": "Nödkontakt – Förnamn", "Emergency Contact – Last Name": "Nödkontakt – Efternamn",
    "Emergency Contact – Mobile Phone": "Nödkontakt – Mobiltelefon",
    "Select Country": "Välj land", "Toggle your Bank": "Välj din bank",
    "Bank Name": "Banknamn", "BIC Code": "BIC-kod", "Bank Account Number": "Kontonummer",
    "ID / Passport Document": "ID / Passhandling", "Work Permit Document": "Arbetstillståndshandling",
  },
};

const LanguageContext = createContext<OnboardingLanguage>("en_sv");

/* ─── Reusable label matching contract wizard ─── */
function FieldLabel({ en, sv, required = true }: { en: string; sv?: string; required?: boolean }) {
  const lang = useContext(LanguageContext);
  let text = "";
  if (lang === "sv") {
    text = LANG_LABELS.sv[en] || sv || en;
  } else if (lang === "en") {
    text = en;
  } else if (lang === "ro_en") {
    const ro = LANG_LABELS.ro[en];
    text = ro ? `${ro} / ${en}` : en;
  } else if (lang === "th_en") {
    const th = LANG_LABELS.th[en];
    text = th ? `${th} / ${en}` : en;
  } else {
    // en_sv default
    const svLabel = sv || LANG_LABELS.sv[en] || "";
    text = svLabel ? `${en} / ${svLabel}` : en;
  }
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
      {text}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

/* ─── Section header matching contract wizard exactly ─── */
const SECTION_TITLES_RO: Record<string, string> = {
  "Name and Address Information": "Informații despre nume și adresă",
  "Birth and Contact Information": "Informații despre naștere și contact",
  "Emergency Contact": "Contact de urgență",
  "Bank Information": "Informații bancare",
  "ID / Passport & Work Permit Information": "Informații ID / Pașaport și permis de muncă",
};
const SECTION_TITLES_TH: Record<string, string> = {
  "Name and Address Information": "ข้อมูลชื่อและที่อยู่",
  "Birth and Contact Information": "ข้อมูลวันเกิดและการติดต่อ",
  "Emergency Contact": "ผู้ติดต่อฉุกเฉิน",
  "Bank Information": "ข้อมูลธนาคาร",
  "ID / Passport & Work Permit Information": "ข้อมูล ID / หนังสือเดินทางและใบอนุญาตทำงาน",
};

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
  const lang = useContext(LanguageContext);
  const hasWarning = showValidation && missingFields.length > 0;
  const isComplete = showValidation && missingFields.length === 0;

  let sectionTitle = "";
  if (lang === "sv") {
    sectionTitle = number ? `Sektion ${number}: ${titleSv}` : titleSv;
  } else if (lang === "en") {
    sectionTitle = number ? `Section ${number}: ${titleEn}` : titleEn;
  } else if (lang === "ro_en") {
    const ro = SECTION_TITLES_RO[titleEn] || titleEn;
    sectionTitle = number ? `Secțiunea ${number}: ${ro} / Section ${number}: ${titleEn}` : `${ro} / ${titleEn}`;
  } else if (lang === "th_en") {
    const th = SECTION_TITLES_TH[titleEn] || titleEn;
    sectionTitle = number ? `ส่วนที่ ${number}: ${th} / Section ${number}: ${titleEn}` : `${th} / ${titleEn}`;
  } else {
    sectionTitle = number
      ? `Section ${number}: ${titleEn} / Sektion ${number}: ${titleSv}`
      : `${titleEn} / ${titleSv}`;
  }

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
          <span className="leading-tight">{sectionTitle}</span>
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
  language = "en_sv",
  showAiFill = false,
  onAiFill,
}: OnboardingWizardProps) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiFill = async (nationality: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-test-data", {
        body: { nationality, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      // Fill fields from AI response
      if (data.firstName) updateField("firstName", data.firstName);
      if (data.middleName) updateField("middleName", data.middleName);
      if (data.lastName) updateField("lastName", data.lastName);
      if (data.preferredName) updateField("preferredName", data.preferredName);
      if (data.address1) updateField("address1", data.address1);
      if (data.address2) updateField("address2", data.address2 || "");
      if (data.zipCode) updateField("zipCode", data.zipCode);
      if (data.city) updateField("city", data.city);
      if (data.stateProvince) updateField("stateProvince", data.stateProvince);
      if (data.country) updateField("country", data.country);
      if (data.birthday) updateField("birthday", data.birthday);
      if (data.countryOfBirth) updateField("countryOfBirth", data.countryOfBirth);
      if (data.citizenship) updateField("citizenship", data.citizenship);
      if (data.mobilePhonePrefix && data.mobilePhoneNumber) {
        updateField("mobilePhone", `${data.mobilePhonePrefix} ${data.mobilePhoneNumber}`);
      }
      if (data.email) updateField("email", data.email);
      if (data.bicCode) updateField("bicCode", data.bicCode);
      if (data.bankAccountNumber) updateField("bankAccountNumber", data.bankAccountNumber.replace(/\D/g, ""));
      if (data.emergencyFirstName) updateField("emergencyFirstName", data.emergencyFirstName);
      if (data.emergencyLastName) updateField("emergencyLastName", data.emergencyLastName);
      if (data.emergencyPhonePrefix && data.emergencyPhoneNumber) {
        updateField("emergencyPhone", `${data.emergencyPhonePrefix} ${data.emergencyPhoneNumber}`);
      }
      
      // Handle bank selection via callback
      if (onAiFill) onAiFill(data);
      
      toast.success("AI test data generated successfully!", {
        description: "Review the auto-filled data and adjust as needed before submitting.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate test data");
    } finally {
      setAiLoading(false);
    }
  };
  const templateLogo = loadTemplateLogo();
  const [banksByCountry, setBanksByCountry] = useState<Record<string, { name: string; bic_code: string | null }[]>>({});
  const [selectedBankCountry, setSelectedBankCountry] = useState<string>("");
  const bankList = selectedBankCountry ? (banksByCountry[selectedBankCountry] || []).map((b) => b.name) : [];

  useEffect(() => {
    supabase
      .from("banks")
      .select("name, country, bic_code")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const grouped: Record<string, { name: string; bic_code: string | null }[]> = {};
          for (const b of data) {
            const c = b.country || "Other";
            if (!grouped[c]) grouped[c] = [];
            grouped[c].push({ name: b.name, bic_code: b.bic_code });
          }
          setBanksByCountry(grouped);
        }
      });
  }, []);
  const [s1Open, setS1Open] = useState(true);
  const [s2Open, setS2Open] = useState(true);
  const [s3Open, setS3Open] = useState(true);
  const [s4Open, setS4Open] = useState(true);
  const [s5Open, setS5Open] = useState(true);
  const [bankListExpanded, setBankListExpanded] = useState(true);
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
  else if (!isPhoneValid(formData.mobilePhone)) {
    const rule = getPhoneRule(formData.mobilePhone);
    s2Missing.push(`Mobile Phone (${rule.min}-${rule.max} digits required)`);
  }
  if (!formData.email) s2Missing.push("Email");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) s2Missing.push("Email (invalid format)");

  const s3Missing: string[] = [];
  if (!formData.emergencyFirstName) s3Missing.push("First Name");
  if (!formData.emergencyLastName) s3Missing.push("Last Name");
  if (!formData.emergencyPhone) s3Missing.push("Mobile Phone");
  else if (!isPhoneValid(formData.emergencyPhone)) {
    const rule = getPhoneRule(formData.emergencyPhone);
    s3Missing.push(`Mobile Phone (${rule.min}-${rule.max} digits required)`);
  }

  const s4Missing: string[] = [];
  if (!selectedBankCountry) s4Missing.push("Country");
  if (!selectedBank && !isOtherBank) s4Missing.push("Bank Selection");
  if (isOtherBank && !formData.otherBankName) s4Missing.push("Bank Name");
  if (!formData.bicCode) s4Missing.push("BIC Code");
  if (!formData.bankAccountNumber) s4Missing.push("Account Number");
  else if (!isBankAccountValid(formData.bankAccountNumber)) s4Missing.push("Account Number (digits only)");

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
    <LanguageContext.Provider value={language}>
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
          {language === "sv" && "Vänligen fyll i följande information fullständigt"}
          {language === "en" && "Please fill out the following information in full"}
          {language === "en_sv" && "Please fill out the following information in full / Vänligen fyll i följande information fullständigt"}
          {language === "ro_en" && "Vă rugăm să completați toate informațiile de mai jos / Please fill out the following information in full"}
          {language === "th_en" && "กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วน / Please fill out the following information in full"}
        </p>

        {isPreview && (
          <div className="text-center mb-5">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              Preview Mode
            </span>
          </div>
        )}

        {/* AI Auto-Fill for Testing */}
        {showAiFill && !isPreview && (
          <div className="mb-5 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-primary">AI Test Data Generator</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Generate realistic test data for a seasonal worker. Select nationality:
            </p>
            <div className="flex flex-wrap gap-2">
              {["Romanian", "Thai", "Swedish"].map((nat) => (
                <Button
                  key={nat}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiLoading}
                  onClick={() => handleAiFill(nat)}
                  className="gap-1.5 text-xs"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {nat} Worker
                </Button>
              ))}
            </div>
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
                      {priorityCountryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <div className="border-t border-border my-1" />
                      {otherCountryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <FieldLabel en="Date of Birth" sv="Födelsedatum" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  value={formData.birthday || ""}
                  onChange={(e) => {
                    // Auto-format: allow digits and auto-insert dashes for YYYY-MM-DD
                    let v = e.target.value.replace(/[^\d-]/g, "");
                    // Remove all dashes first, then reformat
                    const digits = v.replace(/-/g, "");
                    if (digits.length <= 4) {
                      v = digits;
                    } else if (digits.length <= 6) {
                      v = `${digits.slice(0, 4)}-${digits.slice(4)}`;
                    } else {
                      v = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
                    }
                    updateField("birthday", v);
                  }}
                  maxLength={10}
                  className={cn("h-11 text-sm font-medium", fieldError(!formData.birthday || !isBirthdayReasonable(formData.birthday || "")))}
                />
                <p className="text-[10px] text-muted-foreground">ISO 8601 format: YYYY-MM-DD</p>
                {formData.birthday && !isBirthdayReasonable(formData.birthday) && (
                  <p className="text-[11px] text-destructive">
                    Age must be between {MIN_AGE} and {MAX_AGE} years old
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <FieldLabel en="Swedish Coordination Number" sv="Svenskt samordningsnummer" required={false} />
                  <Input
                    value={formData.swedishCoordinationNumber || ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                      const v = digits.length === 12 ? `${digits.slice(0, 8)}-${digits.slice(8)}` : digits;
                      updateField("swedishCoordinationNumber", v);
                    }}
                    placeholder="YYYYMMDD-XXXX"
                    maxLength={13}
                    className="h-11 text-sm font-medium"
                  />
                  {formData.swedishCoordinationNumber && formData.swedishCoordinationNumber.length > 0 && formData.swedishCoordinationNumber.replace(/-/g, "").length !== 12 && (
                    <p className="text-[11px] text-destructive">Must be exactly 12 digits</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Swedish Personal Number" sv="Svenskt personnummer" required={false} />
                  <Input
                    value={formData.swedishPersonalNumber || ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                      const v = digits.length === 12 ? `${digits.slice(0, 8)}-${digits.slice(8)}` : digits;
                      updateField("swedishPersonalNumber", v);
                    }}
                    placeholder="YYYYMMDD-XXXX"
                    maxLength={13}
                    className="h-11 text-sm font-medium"
                  />
                  {formData.swedishPersonalNumber && formData.swedishPersonalNumber.length > 0 && formData.swedishPersonalNumber.replace(/-/g, "").length !== 12 && (
                    <p className="text-[11px] text-destructive">Must be exactly 12 digits</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <FieldLabel en="Country of Birth" sv="Födelseland" />
                  <Select value={formData.countryOfBirth} onValueChange={(v) => {
                    updateField("countryOfBirth", v);
                    if (!formData.citizenship) updateField("citizenship", v);
                  }}>
                    <SelectTrigger className={cn("h-11 text-sm font-medium", fieldError(!formData.countryOfBirth))}><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {priorityCountryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <div className="border-t border-border my-1" />
                      {otherCountryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel en="Citizenship" sv="Medborgarskap" />
                  <Select value={formData.citizenship} onValueChange={(v) => {
                    updateField("citizenship", v);
                    if (!formData.countryOfBirth) updateField("countryOfBirth", v);
                  }}>
                    <SelectTrigger className={cn("h-11 text-sm font-medium", fieldError(!formData.citizenship))}><SelectValue placeholder="Select citizenship" /></SelectTrigger>
                    <SelectContent>
                      {priorityCountryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <div className="border-t border-border my-1" />
                      {otherCountryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel en="Mobile Phone Number" sv="Mobiltelefon" />
                <div className="flex gap-2">
                  <Select
                    value={formData.mobilePhone?.match(/^\+[\d-]+/)?.[0] || "+40"}
                    onValueChange={(prefix) => {
                      const digits = (formData.mobilePhone || "").replace(/^\+[\d-]+\s*/, "");
                      updateField("mobilePhone", `${prefix} ${digits}`);
                    }}
                  >
                    <SelectTrigger className="w-28 h-11 text-sm font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {priorityCountries.map((c) => (
                        <SelectItem key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </SelectItem>
                      ))}
                      <div className="border-t border-border my-1" />
                      {otherCountries.map((c) => (
                        <SelectItem key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={(formData.mobilePhone || "").replace(/^\+[\d-]+\s*/, "")}
                    onChange={(e) => {
                      const maxD = getPhoneMaxDigits(formData.mobilePhone || "+40");
                      const digits = e.target.value.replace(/\D/g, "").slice(0, maxD);
                      // Strip leading zero when prefix is present
                      const cleaned = digits.replace(/^0+/, "");
                      const prefix = formData.mobilePhone?.match(/^\+[\d-]+/)?.[0] || "+40";
                      updateField("mobilePhone", `${prefix} ${cleaned}`);
                    }}
                    maxLength={getPhoneMaxDigits(formData.mobilePhone || "+40")}
                    placeholder={getPhoneRule(formData.mobilePhone || "+40").placeholder}
                    className={cn("flex-1 h-11 text-sm font-medium", fieldError(!formData.mobilePhone || !isPhoneValid(formData.mobilePhone)))}
                  />
                </div>
                {formData.mobilePhone && isPhoneTooLong(formData.mobilePhone) && (
                  <p className="text-[11px] text-destructive">Phone number exceeds maximum length for this country</p>
                )}
                {formData.mobilePhone && !isPhoneTooLong(formData.mobilePhone) && extractPhoneDigits(formData.mobilePhone).length > 0 && extractPhoneDigits(formData.mobilePhone).length < getPhoneRule(formData.mobilePhone).min && (
                  <p className="text-[11px] text-destructive">Phone number must be at least {getPhoneRule(formData.mobilePhone).min} digits</p>
                )}
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
                  <Select
                    value={formData.emergencyPhone?.match(/^\+[\d-]+/)?.[0] || "+40"}
                    onValueChange={(prefix) => {
                      const digits = (formData.emergencyPhone || "").replace(/^\+[\d-]+\s*/, "");
                      updateField("emergencyPhone", `${prefix} ${digits}`);
                    }}
                  >
                    <SelectTrigger className="w-28 h-11 text-sm font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {priorityCountries.map((c) => (
                        <SelectItem key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </SelectItem>
                      ))}
                      <div className="border-t border-border my-1" />
                      {otherCountries.map((c) => (
                        <SelectItem key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={(formData.emergencyPhone || "").replace(/^\+[\d-]+\s*/, "")}
                    onChange={(e) => {
                      const maxD = getPhoneMaxDigits(formData.emergencyPhone || "+40");
                      const digits = e.target.value.replace(/\D/g, "").slice(0, maxD);
                      const cleaned = digits.replace(/^0+/, "");
                      const prefix = formData.emergencyPhone?.match(/^\+[\d-]+/)?.[0] || "+40";
                      updateField("emergencyPhone", `${prefix} ${cleaned}`);
                    }}
                    maxLength={getPhoneMaxDigits(formData.emergencyPhone || "+40")}
                    placeholder={getPhoneRule(formData.emergencyPhone || "+40").placeholder}
                    className={cn("flex-1 h-11 text-sm font-medium", fieldError(!formData.emergencyPhone || !isPhoneValid(formData.emergencyPhone)))}
                  />
                </div>
                {formData.emergencyPhone && isPhoneTooLong(formData.emergencyPhone) && (
                  <p className="text-[11px] text-destructive">Phone number exceeds maximum length for this country</p>
                )}
                {formData.emergencyPhone && !isPhoneTooLong(formData.emergencyPhone) && extractPhoneDigits(formData.emergencyPhone).length > 0 && extractPhoneDigits(formData.emergencyPhone).length < getPhoneRule(formData.emergencyPhone).min && (
                  <p className="text-[11px] text-destructive">Phone number must be at least {getPhoneRule(formData.emergencyPhone).min} digits</p>
                )}
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
              {/* Country selector */}
              <div className="space-y-1.5">
                <FieldLabel en="Select Country" sv="Välj land" />
                <Select value={selectedBankCountry} onValueChange={(val) => { setSelectedBankCountry(val); onBankSelect(""); setBankListExpanded(true); }}>
                  <SelectTrigger className={cn("h-11 text-sm font-medium", fieldError(!selectedBankCountry))}>
                    <SelectValue placeholder="Choose country / Välj land" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(banksByCountry).sort().map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bank radio list – only shown after country is selected */}
              {selectedBankCountry && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FieldLabel en="Toggle your Bank" sv="Välj din bank" />
                  {(selectedBank || isOtherBank) && !bankListExpanded && (
                    <button
                      type="button"
                      onClick={() => setBankListExpanded(true)}
                      className="text-xs text-primary underline hover:text-primary/80"
                    >
                      Change bank / Byt bank
                    </button>
                  )}
                </div>

                {/* Selected bank summary (shown when collapsed) */}
                {(selectedBank || isOtherBank) && !bankListExpanded && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary">
                      {isOtherBank ? (formData.otherBankName || "Other Bank") : selectedBank}
                    </span>
                  </div>
                )}

                {/* Bank list (expanded) */}
                {bankListExpanded && (
                <RadioGroup
                  value={isOtherBank ? "other" : selectedBank}
                  onValueChange={(val) => {
                    onBankSelect(val);
                    // Auto-fill BIC code
                    if (val !== "other") {
                      const match = (banksByCountry[selectedBankCountry] || []).find((b) => b.name === val);
                      if (match?.bic_code) updateField("bicCode", match.bic_code);
                    }
                    // Collapse the list after selection
                    setBankListExpanded(false);
                  }}
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
                )}
              </div>
              )}
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
                  <Input
                    inputMode="numeric"
                    value={formData.bankAccountNumber || ""}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      updateField("bankAccountNumber", digitsOnly);
                    }}
                    placeholder="Digits only"
                    className={cn("h-11 text-sm font-medium", fieldError(!formData.bankAccountNumber || !isBankAccountValid(formData.bankAccountNumber || "")))}
                  />
                  {formData.bankAccountNumber && !isBankAccountValid(formData.bankAccountNumber) && (
                    <p className="text-[11px] text-destructive">Bank account number must contain only digits — no letters or special characters</p>
                  )}
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
    </LanguageContext.Provider>
  );
}
