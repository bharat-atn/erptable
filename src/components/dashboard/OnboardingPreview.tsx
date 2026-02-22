import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { OnboardingWizard, PersonalInfo } from "@/components/onboarding/OnboardingWizard";

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
      {/* Floating close button - positioned above mobile nav */}
      <Button
        variant="default"
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 shadow-lg gap-2"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Switch to Admin View</span>
        <span className="sm:hidden">Admin</span>
      </Button>

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
      />
    </div>
  );
}
