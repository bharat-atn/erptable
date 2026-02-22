import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { OnboardingWizard, PersonalInfo, type OnboardingLanguage } from "@/components/onboarding/OnboardingWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo data to show in preview mode
const DEMO_DATA: Partial<PersonalInfo> = {
  firstName: "John",
  middleName: "Michael",
  lastName: "Doe",
  preferredName: "Johnny",
  address1: "123 Main Street",
  address2: "Apt 4B",
  zipCode: "10001",
  city: "New York",
  stateProvince: "NY",
  country: "USA",
  birthday: "1990-05-15",
  countryOfBirth: "USA",
  citizenship: "USA",
  mobilePhone: "5551234567",
  email: "john.doe@example.com",
  bankName: "BANCA TRANSILVANIA S.A.",
  bicCode: "BTRLRO22",
  bankAccountNumber: "RO49BTRL1234567890123456",
  emergencyFirstName: "Jane",
  emergencyLastName: "Doe",
  emergencyPhone: "5559876543",
};

interface OnboardingPreviewProps {
  onClose: () => void;
}

export function OnboardingPreview({ onClose }: OnboardingPreviewProps) {
  const [formData, setFormData] = useState<Partial<PersonalInfo>>(DEMO_DATA);
  const [selectedBank, setSelectedBank] = useState<string>("BANCA TRANSILVANIA S.A.");
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [workPermitFile, setWorkPermitFile] = useState<File | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<OnboardingLanguage>("en_sv");

  const updateField = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankSelect = (bank: string) => {
    if (bank === "other") {
      setIsOtherBank(true);
      setSelectedBank("");
    } else {
      setIsOtherBank(false);
      setSelectedBank(bank);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleWorkPermitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWorkPermitFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preview mode - do nothing
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Floating controls */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2">
        <Select value={previewLanguage} onValueChange={(v) => setPreviewLanguage(v as OnboardingLanguage)}>
          <SelectTrigger className="w-[180px] h-9 bg-background shadow-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en_sv">English + Swedish</SelectItem>
            <SelectItem value="en">English only</SelectItem>
            <SelectItem value="sv">Swedish only</SelectItem>
            <SelectItem value="ro_en">Romanian + English</SelectItem>
            <SelectItem value="th_en">Thai + English</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="default"
          className="shadow-lg gap-2"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Admin View</span>
          <span className="sm:hidden">Admin</span>
        </Button>
      </div>

      <OnboardingWizard
        formData={formData}
        updateField={updateField}
        onSubmit={handleSubmit}
        isSubmitting={false}
        isPreview={true}
        selectedBank={selectedBank}
        isOtherBank={isOtherBank}
        onBankSelect={handleBankSelect}
        uploadedFile={uploadedFile}
        onFileChange={handleFileChange}
        workPermitFile={workPermitFile}
        onWorkPermitFileChange={handleWorkPermitFileChange}
        language={previewLanguage}
      />
    </div>
  );
}
