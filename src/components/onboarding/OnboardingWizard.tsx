import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronUp, Folder } from "lucide-react";
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

const BANKS = [
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
  birthday: z.string().min(1, "Birthday is required"),
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
}

const SectionHeader = forwardRef<HTMLButtonElement, { title: string; open: boolean }>(
  ({ title, open, ...props }, ref) => (
    <CollapsibleTrigger
      ref={ref}
      {...props}
      className="flex items-center justify-between w-full rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
    >
      <span>{title}</span>
      <ChevronUp className={cn("w-4 h-4 transition-transform", !open && "rotate-180")} />
    </CollapsibleTrigger>
  )
);
SectionHeader.displayName = "SectionHeader";

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-xs font-bold uppercase tracking-wide text-foreground">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
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
}: OnboardingWizardProps) {
  const [s1Open, setS1Open] = useState(true);
  const [s2Open, setS2Open] = useState(true);
  const [s3Open, setS3Open] = useState(true);
  const [s4Open, setS4Open] = useState(true);
  const [s5Open, setS5Open] = useState(true);

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={ljunganLogo} alt="Ljungan Forestry" className="w-20 h-20 mb-1 object-contain" />
          <span className="font-bold text-primary text-lg tracking-widest uppercase">
            Ljungan Forestry
          </span>
        </div>

        <p className="text-center text-primary font-semibold text-base mb-8">
          Please fill out the following information in full
        </p>

        {isPreview && (
          <div className="text-center mb-6">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              Preview Mode
            </span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Section 2.1: Name and Address Information */}
          <Collapsible open={s1Open} onOpenChange={setS1Open}>
            <SectionHeader
              title="Section 2.1: Name and Address Information / Sektion 2.1: Namn och Adressinformation"
              open={s1Open}
            />
            <CollapsibleContent className="pt-6 pb-2 px-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <FieldLabel required>First Name / Förnamn</FieldLabel>
                  <Input value={formData.firstName || ""} onChange={(e) => updateField("firstName", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Middle Name / Mellannamn</FieldLabel>
                  <Input value={formData.middleName || ""} onChange={(e) => updateField("middleName", e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Last Name / Efternamn</FieldLabel>
                  <Input value={formData.lastName || ""} onChange={(e) => updateField("lastName", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Preferred Name / Tilltalsnamn</FieldLabel>
                  <Input value={formData.preferredName || ""} onChange={(e) => updateField("preferredName", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Address 1 / Adress 1</FieldLabel>
                  <Input value={formData.address1 || ""} onChange={(e) => updateField("address1", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Address 2 / Adress 2</FieldLabel>
                  <Input value={formData.address2 || ""} onChange={(e) => updateField("address2", e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>ZIP / Postal Code / Postnummer</FieldLabel>
                  <Input value={formData.zipCode || ""} onChange={(e) => updateField("zipCode", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>City / Ort</FieldLabel>
                  <Input value={formData.city || ""} onChange={(e) => updateField("city", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>State / Province / Län / Region</FieldLabel>
                  <Input value={formData.stateProvince || ""} onChange={(e) => updateField("stateProvince", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Country / Land</FieldLabel>
                  <Select value={formData.country} onValueChange={(v) => updateField("country", v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section 2.2: Birth and Contact Information */}
          <Collapsible open={s2Open} onOpenChange={setS2Open}>
            <SectionHeader
              title="Section 2.2: Birth and Contact Information / Sektion 2.2: Födelse- och Kontaktinformation"
              open={s2Open}
            />
            <CollapsibleContent className="pt-6 pb-2 px-1 space-y-5">
              <div className="space-y-1.5">
                <FieldLabel required>Birthday / Födelsedag</FieldLabel>
                <Input type="date" value={formData.birthday || ""} onChange={(e) => updateField("birthday", e.target.value)} required={!isPreview} className="h-11" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <FieldLabel required>Country of Birth? / Födelseland?</FieldLabel>
                  <Select value={formData.countryOfBirth} onValueChange={(v) => updateField("countryOfBirth", v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Citizenship? / Medborgarskap?</FieldLabel>
                  <Select value={formData.citizenship} onValueChange={(v) => updateField("citizenship", v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select citizenship" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Mobile Phone Number / Mobiltelefon</FieldLabel>
                <div className="flex gap-2">
                  <Select defaultValue="RO">
                    <SelectTrigger className="w-24 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RO">🇷🇴 +40</SelectItem>
                      <SelectItem value="US">🇺🇸 +1</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="SE">🇸🇪 +46</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="tel" value={formData.mobilePhone || ""} onChange={(e) => updateField("mobilePhone", e.target.value)} className="flex-1 h-11" required={!isPreview} />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Email / E-post</FieldLabel>
                <Input type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} required={!isPreview} className="h-11" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section 2.3: Emergency Contact Information */}
          <Collapsible open={s3Open} onOpenChange={setS3Open}>
            <SectionHeader
              title="Section 2.3: Emergency Contact Information / Sektion 2.3: Nödkontaktinformation"
              open={s3Open}
            />
            <CollapsibleContent className="pt-6 pb-2 px-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <FieldLabel required>Emergency Contact First Name / Förnamn</FieldLabel>
                  <Input value={formData.emergencyFirstName || ""} onChange={(e) => updateField("emergencyFirstName", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Emergency Contact Last Name / Efternamn</FieldLabel>
                  <Input value={formData.emergencyLastName || ""} onChange={(e) => updateField("emergencyLastName", e.target.value)} required={!isPreview} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Emergency Contact Mobile Phone / Mobiltelefon</FieldLabel>
                <div className="flex gap-2">
                  <Select defaultValue="RO">
                    <SelectTrigger className="w-24 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RO">🇷🇴 +40</SelectItem>
                      <SelectItem value="US">🇺🇸 +1</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="SE">🇸🇪 +46</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="tel" value={formData.emergencyPhone || ""} onChange={(e) => updateField("emergencyPhone", e.target.value)} className="flex-1 h-11" required={!isPreview} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bank Information */}
          <Collapsible open={s4Open} onOpenChange={setS4Open}>
            <SectionHeader
              title="Bank Information / Bankinformation"
              open={s4Open}
            />
            <CollapsibleContent className="pt-6 pb-2 px-1 space-y-5">
              <div className="space-y-3">
                <FieldLabel required>Toggle your Bank / Välj din bank</FieldLabel>
                <RadioGroup
                  value={isOtherBank ? "other" : selectedBank}
                  onValueChange={onBankSelect}
                  className="space-y-2"
                >
                  {BANKS.map((bank) => (
                    <div key={bank} className="flex items-center space-x-2.5">
                      <RadioGroupItem value={bank} id={bank} />
                      <Label htmlFor={bank} className="font-normal cursor-pointer text-sm text-primary">{bank}</Label>
                    </div>
                  ))}
                  <div className="pt-3 mt-2 border-t border-border">
                    <Label className="text-xs font-bold uppercase tracking-wide text-foreground mb-2 block">
                      Toggle here if your bank is not in the list above
                    </Label>
                    <div className="flex items-center space-x-2.5">
                      <RadioGroupItem value="other" id="other-bank" />
                      <Label htmlFor="other-bank" className="font-normal cursor-pointer text-sm">Other Bank</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              {isOtherBank && (
                <div className="space-y-1.5">
                  <FieldLabel required>Bank Name / Banknamn</FieldLabel>
                  <Input value={formData.otherBankName || ""} onChange={(e) => updateField("otherBankName", e.target.value)} className="h-11" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <FieldLabel required>BIC Code</FieldLabel>
                  <Input value={formData.bicCode || ""} onChange={(e) => updateField("bicCode", e.target.value)} required={!isPreview} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Bank Account Number / Kontonummer</FieldLabel>
                  <Input value={formData.bankAccountNumber || ""} onChange={(e) => updateField("bankAccountNumber", e.target.value)} required={!isPreview} className="h-11" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ID / Passport Information */}
          <Collapsible open={s5Open} onOpenChange={setS5Open}>
            <SectionHeader
              title="ID / Passport Information / ID- / Passinformation"
              open={s5Open}
            />
            <CollapsibleContent className="pt-6 pb-2 px-1 space-y-5">
              <div className="space-y-3">
                <FieldLabel required>Please attach your valid EU ID or Passport / Bifoga ditt giltiga EU-ID eller pass</FieldLabel>
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input type="file" id="id-upload" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
                  <label htmlFor="id-upload" className="cursor-pointer block">
                    <Folder className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a file or <span className="text-primary font-semibold underline">browse</span>
                    </p>
                    {uploadedFile && (
                      <p className="mt-3 text-sm text-primary font-semibold">{uploadedFile.name}</p>
                    )}
                  </label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit */}
          <div className="flex justify-center pt-6 pb-10">
            <Button type="submit" disabled={isSubmitting || isPreview} size="lg" className="px-12 py-3 font-bold text-base rounded-full shadow-md">
              {isSubmitting ? "Submitting..." : "Please submit this form"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
