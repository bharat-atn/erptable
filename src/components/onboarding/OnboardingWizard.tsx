import { useState } from "react";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreePine, Upload, ChevronUp } from "lucide-react";
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
    <CollapsibleTrigger ref={ref} {...props} className="flex items-center justify-between w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      <span>{title}</span>
      <ChevronUp className={cn("w-4 h-4 transition-transform", !open && "rotate-180")} />
    </CollapsibleTrigger>
  )
);
SectionHeader.displayName = "SectionHeader";

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
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <TreePine className="w-10 h-10 text-primary" />
          </div>
          <span className="font-bold text-primary text-lg tracking-wide">LJUNGAN FORESTRY</span>
        </div>

        <p className="text-center text-primary font-medium text-sm mb-6">
          Please fill out the following information in full
        </p>

        {isPreview && (
          <div className="text-center mb-4">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
              Preview Mode
            </span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Section 2.1: Name and Address */}
          <Collapsible open={s1Open} onOpenChange={setS1Open}>
            <SectionHeader title="Section 2.1 : Name and Address Information" open={s1Open} />
            <CollapsibleContent className="pt-4 space-y-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">First Name *</Label>
                  <Input value={formData.firstName || ""} onChange={(e) => updateField("firstName", e.target.value)} required={!isPreview} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Middle Name</Label>
                  <Input value={formData.middleName || ""} onChange={(e) => updateField("middleName", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Last Name *</Label>
                  <Input value={formData.lastName || ""} onChange={(e) => updateField("lastName", e.target.value)} required={!isPreview} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Preferred Name *</Label>
                  <Input value={formData.preferredName || ""} onChange={(e) => updateField("preferredName", e.target.value)} required={!isPreview} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Address 1 *</Label>
                  <Input value={formData.address1 || ""} onChange={(e) => updateField("address1", e.target.value)} required={!isPreview} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Address 2</Label>
                  <Input value={formData.address2 || ""} onChange={(e) => updateField("address2", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">ZIP / Postal Code *</Label>
                  <Input value={formData.zipCode || ""} onChange={(e) => updateField("zipCode", e.target.value)} required={!isPreview} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">City *</Label>
                  <Input value={formData.city || ""} onChange={(e) => updateField("city", e.target.value)} required={!isPreview} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">State / Province *</Label>
                  <Input value={formData.stateProvince || ""} onChange={(e) => updateField("stateProvince", e.target.value)} required={!isPreview} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Country *</Label>
                  <Select value={formData.country} onValueChange={(v) => updateField("country", v)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section 2.2: Birth and Contact */}
          <Collapsible open={s2Open} onOpenChange={setS2Open}>
            <SectionHeader title="Section 2.2: Birth and Contact Information" open={s2Open} />
            <CollapsibleContent className="pt-4 space-y-4 px-1">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Birthday *</Label>
                <Input type="date" value={formData.birthday || ""} onChange={(e) => updateField("birthday", e.target.value)} required={!isPreview} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Country of Birth? *</Label>
                <Select value={formData.countryOfBirth} onValueChange={(v) => updateField("countryOfBirth", v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Citizenship? *</Label>
                <Select value={formData.citizenship} onValueChange={(v) => updateField("citizenship", v)}>
                  <SelectTrigger><SelectValue placeholder="Select citizenship" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Mobile Phone Number *</Label>
                <div className="flex gap-2">
                  <Select defaultValue="RO">
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RO">🇷🇴</SelectItem>
                      <SelectItem value="US">🇺🇸</SelectItem>
                      <SelectItem value="DE">🇩🇪</SelectItem>
                      <SelectItem value="SE">🇸🇪</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="tel" value={formData.mobilePhone || ""} onChange={(e) => updateField("mobilePhone", e.target.value)} className="flex-1" required={!isPreview} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email *</Label>
                <Input type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} required={!isPreview} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section 2.3: Emergency Contact */}
          <Collapsible open={s3Open} onOpenChange={setS3Open}>
            <SectionHeader title="Section 2.3: Emergency Contact Information" open={s3Open} />
            <CollapsibleContent className="pt-4 space-y-4 px-1">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Emergency Contact First Name *</Label>
                <Input value={formData.emergencyFirstName || ""} onChange={(e) => updateField("emergencyFirstName", e.target.value)} required={!isPreview} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Emergency Contact Last Name *</Label>
                <Input value={formData.emergencyLastName || ""} onChange={(e) => updateField("emergencyLastName", e.target.value)} required={!isPreview} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Emergency Contact Mobile Phone Number *</Label>
                <div className="flex gap-2">
                  <Select defaultValue="RO">
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RO">🇷🇴</SelectItem>
                      <SelectItem value="US">🇺🇸</SelectItem>
                      <SelectItem value="DE">🇩🇪</SelectItem>
                      <SelectItem value="SE">🇸🇪</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="tel" value={formData.emergencyPhone || ""} onChange={(e) => updateField("emergencyPhone", e.target.value)} className="flex-1" required={!isPreview} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bank Information */}
          <Collapsible open={s4Open} onOpenChange={setS4Open}>
            <SectionHeader title="Bank Information" open={s4Open} />
            <CollapsibleContent className="pt-4 space-y-4 px-1">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Toggle your Bank</Label>
                <RadioGroup
                  value={isOtherBank ? "other" : selectedBank}
                  onValueChange={onBankSelect}
                  className="space-y-1"
                >
                  {BANKS.map((bank) => (
                    <div key={bank} className="flex items-center space-x-2">
                      <RadioGroupItem value={bank} id={bank} />
                      <Label htmlFor={bank} className="font-normal cursor-pointer text-sm text-primary">{bank}</Label>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <Label className="text-sm font-medium mb-2 block">Toggle here if your bank is not in the list above</Label>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other-bank" />
                      <Label htmlFor="other-bank" className="font-normal cursor-pointer text-sm">Other Bank</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              {isOtherBank && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Bank Name *</Label>
                  <Input value={formData.otherBankName || ""} onChange={(e) => updateField("otherBankName", e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">BIC Code *</Label>
                <Input value={formData.bicCode || ""} onChange={(e) => updateField("bicCode", e.target.value)} required={!isPreview} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Your bank account number *</Label>
                <Input value={formData.bankAccountNumber || ""} onChange={(e) => updateField("bankAccountNumber", e.target.value)} required={!isPreview} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ID / Passport Information */}
          <Collapsible open={s5Open} onOpenChange={setS5Open}>
            <SectionHeader title="ID / Passport Information" open={s5Open} />
            <CollapsibleContent className="pt-4 space-y-4 px-1">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Please attach your valid EU ID or Passport *</Label>
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input type="file" id="id-upload" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
                  <label htmlFor="id-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a file or <span className="text-primary font-medium underline">browse</span>
                    </p>
                    {uploadedFile && (
                      <p className="mt-2 text-sm text-primary font-medium">{uploadedFile.name}</p>
                    )}
                  </label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit */}
          <div className="flex justify-center pt-4 pb-8">
            <Button type="submit" disabled={isSubmitting || isPreview} className="px-8">
              {isSubmitting ? "Submitting..." : "Please submit this form"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
