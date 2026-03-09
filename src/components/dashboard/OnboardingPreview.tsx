import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { OnboardingWizard, PersonalInfo, personalInfoSchema, type OnboardingLanguage } from "@/components/onboarding/OnboardingWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { z } from "zod";

interface OnboardingPreviewProps {
  onClose: () => void;
}

export function OnboardingPreview({ onClose }: OnboardingPreviewProps) {
  const [formData, setFormData] = useState<Partial<PersonalInfo>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [workPermitFile, setWorkPermitFile] = useState<File | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<OnboardingLanguage>("en_sv");
  const { orgId: currentOrgId } = useOrg();
  const queryClient = useQueryClient();

  const updateField = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const submitReal = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      if (!currentOrgId) throw new Error("No organization selected");

      const personalInfo: Record<string, any> = {
        preferredName: data.preferredName,
        address1: data.address1,
        address2: data.address2,
        zipCode: data.zipCode,
        city: data.city,
        stateProvince: data.stateProvince,
        country: data.country,
        birthday: data.birthday,
        countryOfBirth: data.countryOfBirth,
        citizenship: data.citizenship,
        mobilePhone: data.mobilePhone,
        bankName: data.bankName,
        bicCode: data.bicCode,
        bankAccountNumber: data.bankAccountNumber,
        swedishCoordinationNumber: data.swedishCoordinationNumber,
        swedishPersonalNumber: data.swedishPersonalNumber,
        emergencyContact: {
          firstName: data.emergencyFirstName,
          lastName: data.emergencyLastName,
          phone: data.emergencyPhone,
        },
      };

      // 1. Create employee
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .insert([{
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName || null,
          email: data.email,
          phone: data.mobilePhone,
          city: data.city,
          country: data.country,
          status: "ONBOARDING" as const,
          personal_info: personalInfo,
          org_id: currentOrgId,
        }])
        .select("id")
        .single();

      if (empError) throw empError;

      // 2. Create ACCEPTED invitation
      const { error: invError } = await supabase
        .from("invitations")
        .insert([{
          employee_id: emp.id,
          org_id: currentOrgId,
          type: "NEW_HIRE" as const,
          language: previewLanguage,
          status: "ACCEPTED" as const,
        }]);

      if (invError) throw invError;

      // 3. Create draft contract
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("org_id", currentOrgId)
        .limit(1)
        .single();

      const { error: contractError } = await supabase
        .from("contracts")
        .insert([{
          employee_id: emp.id,
          org_id: currentOrgId,
          company_id: company?.id || null,
          status: "draft",
          signing_status: "not_sent",
          season_year: new Date().getFullYear().toString(),
        }]);

      if (contractError) throw contractError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["operations-employees"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Submitted! The candidate now appears in Invitations and Operations.", {
        description: "You can close this view and continue to create the employment contract.",
      });
    },
    onError: (error: Error) => {
      toast.error("Submission failed", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = personalInfoSchema.parse(formData);
      submitReal.mutate(validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    }
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
            <SelectItem value="uk_en">Ukrainian + English</SelectItem>
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
        isSubmitting={submitReal.isPending}
        isPreview={false}
        uploadedFile={uploadedFile}
        onFileChange={handleFileChange}
        workPermitFile={workPermitFile}
        onWorkPermitFileChange={handleWorkPermitFileChange}
        language={previewLanguage}
        showAiFill={true}
        onAiFill={() => {}}
      />
    </div>
  );
}
