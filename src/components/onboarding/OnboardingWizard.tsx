import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, TreePine, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";

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

const STEPS = [
  { id: "name-address", label: "Name & Address", shortLabel: "Name" },
  { id: "birth-contact", label: "Birth & Contact", shortLabel: "Contact" },
  { id: "bank", label: "Bank Info", shortLabel: "Bank" },
  { id: "emergency-id", label: "Emergency & ID", shortLabel: "Emergency" },
  { id: "review", label: "Review & Sign", shortLabel: "Review" },
];

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
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <NameAddressStep formData={formData} updateField={updateField} isPreview={isPreview} />;
      case 1:
        return <BirthContactStep formData={formData} updateField={updateField} isPreview={isPreview} />;
      case 2:
        return (
          <BankStep
            formData={formData}
            updateField={updateField}
            isPreview={isPreview}
            selectedBank={selectedBank}
            isOtherBank={isOtherBank}
            onBankSelect={onBankSelect}
          />
        );
      case 3:
        return (
          <EmergencyIdStep
            formData={formData}
            updateField={updateField}
            isPreview={isPreview}
            uploadedFile={uploadedFile}
            onFileChange={onFileChange}
          />
        );
      case 4:
        return <ReviewStep formData={formData} selectedBank={selectedBank} isOtherBank={isOtherBank} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <TreePine className="w-8 h-8 text-primary" />
          <span className="font-semibold text-primary">LJUNGAN FORESTRY</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left",
                  isActive && "bg-primary/10 text-primary font-medium",
                  !isActive && !isCompleted && "text-muted-foreground hover:bg-muted",
                  isCompleted && "text-foreground hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  !isActive && !isCompleted && "border-muted-foreground/30",
                  isCompleted && "border-primary bg-primary text-primary-foreground"
                )}>
                  {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span>{step.label}</span>
              </button>
            );
          })}
        </nav>

        {isPreview && (
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Preview Mode - Changes won't be saved
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {STEPS[currentStep].label}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="bg-background rounded-lg border border-border p-6 mb-6">
              {renderStepContent()}
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext} className="gap-2">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || isPreview} className="gap-2">
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// Step Components
function NameAddressStep({ formData, updateField, isPreview }: { 
  formData: Partial<PersonalInfo>; 
  updateField: (field: keyof PersonalInfo, value: string) => void;
  isPreview: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">First Name *</Label>
          <Input
            value={formData.firstName || ""}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Enter first name"
            required={!isPreview}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Middle Name</Label>
          <Input
            value={formData.middleName || ""}
            onChange={(e) => updateField("middleName", e.target.value)}
            placeholder="Enter middle name"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Last Name *</Label>
          <Input
            value={formData.lastName || ""}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Enter last name"
            required={!isPreview}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Preferred Name *</Label>
          <Input
            value={formData.preferredName || ""}
            onChange={(e) => updateField("preferredName", e.target.value)}
            placeholder="Enter preferred name"
            required={!isPreview}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Address 1 *</Label>
          <Input
            value={formData.address1 || ""}
            onChange={(e) => updateField("address1", e.target.value)}
            placeholder="Street address"
            required={!isPreview}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Address 2</Label>
          <Input
            value={formData.address2 || ""}
            onChange={(e) => updateField("address2", e.target.value)}
            placeholder="Apartment, suite, etc."
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">ZIP / Postal Code *</Label>
          <Input
            value={formData.zipCode || ""}
            onChange={(e) => updateField("zipCode", e.target.value)}
            placeholder="Enter postal code"
            required={!isPreview}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">City *</Label>
          <Input
            value={formData.city || ""}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Enter city"
            required={!isPreview}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">State / Province *</Label>
          <Input
            value={formData.stateProvince || ""}
            onChange={(e) => updateField("stateProvince", e.target.value)}
            placeholder="Enter state/province"
            required={!isPreview}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Country *</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => updateField("country", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function BirthContactStep({ formData, updateField, isPreview }: { 
  formData: Partial<PersonalInfo>; 
  updateField: (field: keyof PersonalInfo, value: string) => void;
  isPreview: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Birthday *</Label>
        <Input
          type="date"
          value={formData.birthday || ""}
          onChange={(e) => updateField("birthday", e.target.value)}
          required={!isPreview}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Country of Birth *</Label>
        <Select
          value={formData.countryOfBirth}
          onValueChange={(value) => updateField("countryOfBirth", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Citizenship *</Label>
        <Select
          value={formData.citizenship}
          onValueChange={(value) => updateField("citizenship", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select citizenship" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Mobile Phone Number *</Label>
        <div className="flex gap-2">
          <Select defaultValue="RO">
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RO">🇷🇴</SelectItem>
              <SelectItem value="US">🇺🇸</SelectItem>
              <SelectItem value="DE">🇩🇪</SelectItem>
              <SelectItem value="UK">🇬🇧</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={formData.mobilePhone || ""}
            onChange={(e) => updateField("mobilePhone", e.target.value)}
            placeholder="Enter phone number"
            className="flex-1"
            required={!isPreview}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Email *</Label>
        <Input
          type="email"
          value={formData.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="Enter email address"
          required={!isPreview}
        />
      </div>
    </div>
  );
}

function BankStep({ 
  formData, 
  updateField, 
  isPreview,
  selectedBank,
  isOtherBank,
  onBankSelect,
}: { 
  formData: Partial<PersonalInfo>; 
  updateField: (field: keyof PersonalInfo, value: string) => void;
  isPreview: boolean;
  selectedBank: string;
  isOtherBank: boolean;
  onBankSelect: (bank: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Select your Bank *</Label>
        <RadioGroup
          value={isOtherBank ? "other" : selectedBank}
          onValueChange={onBankSelect}
          className="space-y-2"
        >
          {BANKS.map((bank) => (
            <div key={bank} className="flex items-center space-x-2">
              <RadioGroupItem value={bank} id={bank} />
              <Label htmlFor={bank} className="font-normal cursor-pointer">
                {bank}
              </Label>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other-bank" />
              <Label htmlFor="other-bank" className="font-normal cursor-pointer">
                Other Bank
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {isOtherBank && (
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Bank Name *</Label>
          <Input
            value={formData.otherBankName || ""}
            onChange={(e) => updateField("otherBankName", e.target.value)}
            placeholder="Enter bank name"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground font-medium">BIC Code *</Label>
        <Input
          value={formData.bicCode || ""}
          onChange={(e) => updateField("bicCode", e.target.value)}
          placeholder="Enter BIC code"
          required={!isPreview}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-medium">Bank Account Number *</Label>
        <Input
          value={formData.bankAccountNumber || ""}
          onChange={(e) => updateField("bankAccountNumber", e.target.value)}
          placeholder="Enter account number"
          required={!isPreview}
        />
      </div>
    </div>
  );
}

function EmergencyIdStep({ 
  formData, 
  updateField, 
  isPreview,
  uploadedFile,
  onFileChange,
}: { 
  formData: Partial<PersonalInfo>; 
  updateField: (field: keyof PersonalInfo, value: string) => void;
  isPreview: boolean;
  uploadedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">First Name *</Label>
              <Input
                value={formData.emergencyFirstName || ""}
                onChange={(e) => updateField("emergencyFirstName", e.target.value)}
                placeholder="Enter first name"
                required={!isPreview}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Last Name *</Label>
              <Input
                value={formData.emergencyLastName || ""}
                onChange={(e) => updateField("emergencyLastName", e.target.value)}
                placeholder="Enter last name"
                required={!isPreview}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Phone Number *</Label>
            <div className="flex gap-2">
              <Select defaultValue="RO">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RO">🇷🇴</SelectItem>
                  <SelectItem value="US">🇺🇸</SelectItem>
                  <SelectItem value="DE">🇩🇪</SelectItem>
                  <SelectItem value="UK">🇬🇧</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="tel"
                value={formData.emergencyPhone || ""}
                onChange={(e) => updateField("emergencyPhone", e.target.value)}
                placeholder="Enter phone number"
                className="flex-1"
                required={!isPreview}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-medium mb-4">ID / Passport</h3>
        <div className="space-y-2">
          <Label className="text-foreground font-medium">
            Upload valid EU ID or Passport *
          </Label>
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="id-upload"
              accept="image/*,.pdf"
              onChange={onFileChange}
              className="hidden"
            />
            <label htmlFor="id-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or{" "}
                <span className="text-primary underline">browse</span>
              </p>
              {uploadedFile && (
                <p className="mt-2 text-sm text-primary font-medium">
                  {uploadedFile.name}
                </p>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ 
  formData,
  selectedBank,
  isOtherBank,
}: { 
  formData: Partial<PersonalInfo>;
  selectedBank: string;
  isOtherBank: boolean;
}) {
  const bankName = isOtherBank ? formData.otherBankName : selectedBank;
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Please review your information before submitting.
      </p>
      
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Personal Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span>{formData.firstName} {formData.middleName} {formData.lastName}</span>
            <span className="text-muted-foreground">Email:</span>
            <span>{formData.email}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span>{formData.mobilePhone}</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Address</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Address:</span>
            <span>{formData.address1} {formData.address2}</span>
            <span className="text-muted-foreground">City:</span>
            <span>{formData.city}, {formData.stateProvince}</span>
            <span className="text-muted-foreground">Country:</span>
            <span>{formData.country}</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Bank Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Bank:</span>
            <span>{bankName}</span>
            <span className="text-muted-foreground">BIC:</span>
            <span>{formData.bicCode}</span>
            <span className="text-muted-foreground">Account:</span>
            <span>{formData.bankAccountNumber}</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Emergency Contact</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span>{formData.emergencyFirstName} {formData.emergencyLastName}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span>{formData.emergencyPhone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
