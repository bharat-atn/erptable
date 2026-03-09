import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { OnboardingWizard, type PersonalInfo, type OnboardingLanguage } from "@/components/onboarding/OnboardingWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmissionViewProps {
  employeeId: string;
  onClose: () => void;
}

export function SubmissionView({ employeeId, onClose }: SubmissionViewProps) {
  const [previewLanguage, setPreviewLanguage] = useState<OnboardingLanguage>("en_sv");

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee-submission", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("first_name, last_name, middle_name, email, personal_info")
        .eq("id", employeeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const info = (employee?.personal_info ?? {}) as Record<string, unknown>;

  const formData: Partial<PersonalInfo> = {
    firstName: String(info.firstName ?? info.first_name ?? employee?.first_name ?? ""),
    middleName: String(info.middleName ?? info.middle_name ?? employee?.middle_name ?? ""),
    lastName: String(info.lastName ?? info.last_name ?? employee?.last_name ?? ""),
    preferredName: String(info.preferredName ?? info.preferred_name ?? ""),
    address1: String(info.address1 ?? info.address ?? ""),
    address2: String(info.address2 ?? ""),
    zipCode: String(info.zipCode ?? info.zip_code ?? info.postcode ?? ""),
    city: String(info.city ?? ""),
    stateProvince: String(info.stateProvince ?? info.state_province ?? ""),
    country: String(info.country ?? ""),
    birthday: String(info.birthday ?? info.dateOfBirth ?? info.date_of_birth ?? ""),
    countryOfBirth: String(info.countryOfBirth ?? info.country_of_birth ?? ""),
    citizenship: String(info.citizenship ?? ""),
    mobilePhone: String(info.mobilePhone ?? info.mobile_phone ?? ""),
    email: String(info.email ?? info.privateEmail ?? info.private_email ?? employee?.email ?? ""),
    bankName: String(info.bankName ?? info.bank_name ?? ""),
    bicCode: String(info.bicCode ?? info.bic_code ?? ""),
    bankAccountNumber: String(info.bankAccountNumber ?? info.bank_account_number ?? info.accountNumber ?? info.account_number ?? ""),
    emergencyFirstName: String(
      info.emergencyFirstName ?? info.emergency_first_name ??
      (typeof info.emergencyContact === "object" && info.emergencyContact ? (info.emergencyContact as any).firstName ?? (info.emergencyContact as any).name?.split(" ")[0] ?? "" : "")
    ),
    emergencyLastName: String(
      info.emergencyLastName ?? info.emergency_last_name ??
      (typeof info.emergencyContact === "object" && info.emergencyContact ? (info.emergencyContact as any).lastName ?? (info.emergencyContact as any).name?.split(" ").slice(1).join(" ") ?? "" : "")
    ),
    emergencyPhone: String(
      info.emergencyPhone ?? info.emergency_phone ??
      (typeof info.emergencyContact === "object" && info.emergencyContact ? (info.emergencyContact as any).phone ?? "" : "")
    ),
    swedishPersonalNumber: String(info.swedishPersonalNumber ?? info.personnummer ?? ""),
    swedishCoordinationNumber: String(info.swedishCoordinationNumber ?? info.samordningsnummer ?? ""),
  };

  return (
    <div className="min-h-screen bg-background">
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
            <SelectItem value="uk_en">Ukrainian + English</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="default" className="shadow-lg gap-2" onClick={onClose}>
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Invitations</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="max-w-2xl mx-auto p-8 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <OnboardingWizard
          formData={formData}
          updateField={() => {}}
          onSubmit={(e) => e.preventDefault()}
          isSubmitting={false}
          isPreview={true}
          uploadedFile={null}
          onFileChange={() => {}}
          workPermitFile={null}
          onWorkPermitFileChange={() => {}}
          language={previewLanguage}
        />
      )}
    </div>
  );
}
