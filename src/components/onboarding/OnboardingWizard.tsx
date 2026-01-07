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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TreePine className="w-6 h-6 text-primary" />
              <span className="font-semibold text-primary text-sm">LJUNGAN FORESTRY</span>
            </div>
            {isPreview && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Preview
              </span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{STEPS[currentStep].label}</span>
              <span className="text-muted-foreground">Step {currentStep + 1}/{STEPS.length}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {/* Mobile Step Dots */}
        <div className="flex justify-center gap-2 py-3 bg-background border-b border-border">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95",
                  isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                  isCompleted && "bg-primary/20 text-primary",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
                aria-label={`Go to ${step.label}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </button>
            );
          })}
        </div>

        {/* Mobile Form Content */}
        <main className="flex-1 overflow-auto px-4 py-6 pb-32">
          <form onSubmit={onSubmit} id="onboarding-form">
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              {renderStepContent()}
            </div>
          </form>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 safe-area-bottom">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex-1 h-12 text-base font-medium"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button 
                type="button" 
                onClick={goNext} 
                className="flex-1 h-12 text-base font-medium"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button 
                type="submit"
                form="onboarding-form"
                disabled={isSubmitting || isPreview} 
                className="flex-1 h-12 text-base font-medium"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Layout
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

// Step Components with Mobile-Optimized Styles
function NameAddressStep({ formData, updateField, isPreview }: { 
  formData: Partial<PersonalInfo>; 
  updateField: (field: keyof PersonalInfo, value: string) => void;
  isPreview: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">First Name *</Label>
          <Input
            value={formData.firstName || ""}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Enter first name"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Middle Name</Label>
          <Input
            value={formData.middleName || ""}
            onChange={(e) => updateField("middleName", e.target.value)}
            placeholder="Enter middle name"
            className="h-12 text-base"
          />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Last Name *</Label>
          <Input
            value={formData.lastName || ""}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Enter last name"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Preferred Name *</Label>
          <Input
            value={formData.preferredName || ""}
            onChange={(e) => updateField("preferredName", e.target.value)}
            placeholder="Enter preferred name"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Address 1 *</Label>
          <Input
            value={formData.address1 || ""}
            onChange={(e) => updateField("address1", e.target.value)}
            placeholder="Street address"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Address 2</Label>
          <Input
            value={formData.address2 || ""}
            onChange={(e) => updateField("address2", e.target.value)}
            placeholder="Apartment, suite, etc."
            className="h-12 text-base"
          />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">ZIP / Postal Code *</Label>
          <Input
            value={formData.zipCode || ""}
            onChange={(e) => updateField("zipCode", e.target.value)}
            placeholder="Enter postal code"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">City *</Label>
          <Input
            value={formData.city || ""}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Enter city"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">State / Province *</Label>
          <Input
            value={formData.stateProvince || ""}
            onChange={(e) => updateField("stateProvince", e.target.value)}
            placeholder="Enter state/province"
            required={!isPreview}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Country *</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => updateField("country", value)}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country} className="text-base py-3">
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
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">Birthday *</Label>
        <Input
          type="date"
          value={formData.birthday || ""}
          onChange={(e) => updateField("birthday", e.target.value)}
          required={!isPreview}
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">Country of Birth *</Label>
        <Select
          value={formData.countryOfBirth}
          onValueChange={(value) => updateField("countryOfBirth", value)}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country} className="text-base py-3">
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">Citizenship *</Label>
        <Select
          value={formData.citizenship}
          onValueChange={(value) => updateField("citizenship", value)}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select citizenship" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country} className="text-base py-3">
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">Mobile Phone Number *</Label>
        <div className="flex gap-2">
          <Select defaultValue="RO">
            <SelectTrigger className="w-20 h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RO" className="text-base py-3">🇷🇴</SelectItem>
              <SelectItem value="US" className="text-base py-3">🇺🇸</SelectItem>
              <SelectItem value="DE" className="text-base py-3">🇩🇪</SelectItem>
              <SelectItem value="UK" className="text-base py-3">🇬🇧</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={formData.mobilePhone || ""}
            onChange={(e) => updateField("mobilePhone", e.target.value)}
            placeholder="Enter phone number"
            className="flex-1 h-12 text-base"
            required={!isPreview}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">Email *</Label>
        <Input
          type="email"
          value={formData.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="Enter email address"
          required={!isPreview}
          className="h-12 text-base"
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
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="text-foreground font-medium text-sm">Select your Bank *</Label>
        <RadioGroup
          value={isOtherBank ? "other" : selectedBank}
          onValueChange={onBankSelect}
          className="space-y-2"
        >
          {BANKS.map((bank) => (
            <div key={bank} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={bank} id={bank} className="w-5 h-5" />
              <Label htmlFor={bank} className="font-normal cursor-pointer flex-1 text-base">
                {bank}
              </Label>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="other" id="other-bank" className="w-5 h-5" />
              <Label htmlFor="other-bank" className="font-normal cursor-pointer flex-1 text-base">
                Other Bank
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {isOtherBank && (
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">Bank Name *</Label>
          <Input
            value={formData.otherBankName || ""}
            onChange={(e) => updateField("otherBankName", e.target.value)}
            placeholder="Enter bank name"
            className="h-12 text-base"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">BIC Code *</Label>
        <Input
          value={formData.bicCode || ""}
          onChange={(e) => updateField("bicCode", e.target.value)}
          placeholder="Enter BIC code"
          required={!isPreview}
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-medium text-sm">Bank Account Number *</Label>
        <Input
          value={formData.bankAccountNumber || ""}
          onChange={(e) => updateField("bankAccountNumber", e.target.value)}
          placeholder="Enter account number"
          required={!isPreview}
          className="h-12 text-base"
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
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">First Name *</Label>
              <Input
                value={formData.emergencyFirstName || ""}
                onChange={(e) => updateField("emergencyFirstName", e.target.value)}
                placeholder="Enter first name"
                required={!isPreview}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Last Name *</Label>
              <Input
                value={formData.emergencyLastName || ""}
                onChange={(e) => updateField("emergencyLastName", e.target.value)}
                placeholder="Enter last name"
                required={!isPreview}
                className="h-12 text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-medium text-sm">Phone Number *</Label>
            <div className="flex gap-2">
              <Select defaultValue="RO">
                <SelectTrigger className="w-20 h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RO" className="text-base py-3">🇷🇴</SelectItem>
                  <SelectItem value="US" className="text-base py-3">🇺🇸</SelectItem>
                  <SelectItem value="DE" className="text-base py-3">🇩🇪</SelectItem>
                  <SelectItem value="UK" className="text-base py-3">🇬🇧</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="tel"
                value={formData.emergencyPhone || ""}
                onChange={(e) => updateField("emergencyPhone", e.target.value)}
                placeholder="Enter phone number"
                className="flex-1 h-12 text-base"
                required={!isPreview}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-medium mb-4">ID / Passport</h3>
        <div className="space-y-2">
          <Label className="text-foreground font-medium text-sm">
            Upload valid EU ID or Passport *
          </Label>
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors active:bg-muted/50">
            <input
              type="file"
              id="id-upload"
              accept="image/*,.pdf"
              onChange={onFileChange}
              className="hidden"
            />
            <label htmlFor="id-upload" className="cursor-pointer block">
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-base text-muted-foreground">
                Tap to upload or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
              {uploadedFile && (
                <p className="mt-3 text-sm text-primary font-medium bg-primary/10 rounded-full px-4 py-2 inline-block">
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
    <div className="space-y-5">
      <p className="text-muted-foreground text-base">
        Please review your information before submitting.
      </p>
      
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium mb-3 text-base">Personal Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-right">{formData.firstName} {formData.middleName} {formData.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-right break-all">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{formData.mobilePhone}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium mb-3 text-base">Address</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right">{formData.address1} {formData.address2}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">City</span>
              <span className="font-medium">{formData.city}, {formData.stateProvince}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{formData.country}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium mb-3 text-base">Bank Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium text-right">{bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BIC</span>
              <span className="font-medium">{formData.bicCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-medium break-all text-right">{formData.bankAccountNumber}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium mb-3 text-base">Emergency Contact</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{formData.emergencyFirstName} {formData.emergencyLastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{formData.emergencyPhone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
