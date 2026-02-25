import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingWizard, personalInfoSchema, PersonalInfo } from "@/components/onboarding/OnboardingWizard";
import { z } from "zod";

export default function OnboardingPortal() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<Partial<PersonalInfo>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [workPermitFile, setWorkPermitFile] = useState<File | null>(null);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { _token: token! })
        .single();

      if (error) throw error;
      if (!data) throw new Error("Invitation not found");
      
      // Pre-fill form with existing employee data
      setFormData((prev) => ({
        ...prev,
        firstName: data.employee_first_name || "",
        middleName: data.employee_middle_name || "",
        lastName: data.employee_last_name || "",
        email: data.employee_email || "",
      }));
      
      return data;
    },
    enabled: !!token && token !== "demo",
  });

  const submitOnboarding = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      const validated = personalInfoSchema.parse(data);

      const personalInfo = {
        preferredName: validated.preferredName,
        address1: validated.address1,
        address2: validated.address2,
        zipCode: validated.zipCode,
        city: validated.city,
        stateProvince: validated.stateProvince,
        country: validated.country,
        birthday: validated.birthday,
        countryOfBirth: validated.countryOfBirth,
        citizenship: validated.citizenship,
        mobilePhone: validated.mobilePhone,
        bankName: isOtherBank ? validated.otherBankName : validated.bankName,
        bicCode: validated.bicCode,
        bankAccountNumber: validated.bankAccountNumber,
        swedishCoordinationNumber: validated.swedishCoordinationNumber,
        swedishPersonalNumber: validated.swedishPersonalNumber,
        emergencyContact: {
          firstName: validated.emergencyFirstName,
          lastName: validated.emergencyLastName,
          phone: validated.emergencyPhone,
        },
      };

      const { error } = await supabase.rpc('submit_onboarding', {
        _token: token!,
        _first_name: validated.firstName,
        _middle_name: validated.middleName || '',
        _last_name: validated.lastName,
        _personal_info: personalInfo as any,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Onboarding submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToValidate = {
      ...formData,
      bankName: isOtherBank ? "Other" : selectedBank,
    };
    try {
      const validated = personalInfoSchema.parse(dataToValidate);
      submitOnboarding.mutate(validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    }
  };

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

  // Demo mode
  if (token === "demo") {
    return (
      <OnboardingWizard
        formData={formData}
        updateField={updateField}
        onSubmit={handleSubmit}
        isSubmitting={submitOnboarding.isPending}
        isPreview={false}
        selectedBank={selectedBank}
        isOtherBank={isOtherBank}
        onBankSelect={handleBankSelect}
        uploadedFile={uploadedFile}
        onFileChange={handleFileChange}
        workPermitFile={workPermitFile}
        onWorkPermitFileChange={handleWorkPermitFileChange}
        language="en_sv"
        showAiFill={true}
        onAiFill={(data) => {
          if (data.bankCountry) {
            // Auto-select bank country & bank if available
          }
          if (data.bankName) {
            handleBankSelect(data.bankName);
          }
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-sm">
              {(error as Error)?.message || "This invitation link is not valid."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    const lang = (invitation as any)?.language || "en_sv";
    const confirmationTexts: Record<string, { title: string; message: string }[]> = {
      en: [{ title: "Onboarding Complete!", message: "Thank you for completing your onboarding. Our HR team will be in touch shortly." }],
      sv: [{ title: "Registrering slutförd!", message: "Tack för att du har slutfört din registrering. Vår HR-avdelning kommer att kontakta dig inom kort." }],
      en_sv: [
        { title: "Onboarding Complete!", message: "Thank you for completing your onboarding. Our HR team will be in touch shortly." },
        { title: "Registrering slutförd!", message: "Tack för att du har slutfört din registrering. Vår HR-avdelning kommer att kontakta dig inom kort." },
      ],
      ro_en: [
        { title: "Înregistrare finalizată!", message: "Vă mulțumim că ați completat înregistrarea. Echipa noastră HR vă va contacta în curând." },
        { title: "Onboarding Complete!", message: "Thank you for completing your onboarding. Our HR team will be in touch shortly." },
      ],
      th_en: [
        { title: "การลงทะเบียนเสร็จสมบูรณ์!", message: "ขอบคุณที่ลงทะเบียนเรียบร้อยแล้ว ทีม HR ของเราจะติดต่อคุณในเร็วๆ นี้" },
        { title: "Onboarding Complete!", message: "Thank you for completing your onboarding. Our HR team will be in touch shortly." },
      ],
    };
    const texts = confirmationTexts[lang] || confirmationTexts.en_sv;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            {texts.map((t, i) => (
              <div key={i} className={i > 0 ? "mt-4 pt-4 border-t border-border" : ""}>
                <h2 className={`text-lg font-semibold mb-2 ${i > 0 ? "text-base text-muted-foreground" : ""}`}>{t.title}</h2>
                <p className={`text-sm ${i > 0 ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                  {t.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <OnboardingWizard
      formData={formData}
      updateField={updateField}
      onSubmit={handleSubmit}
      isSubmitting={submitOnboarding.isPending}
      isPreview={false}
      selectedBank={selectedBank}
      isOtherBank={isOtherBank}
      onBankSelect={handleBankSelect}
      uploadedFile={uploadedFile}
      onFileChange={handleFileChange}
      workPermitFile={workPermitFile}
      onWorkPermitFileChange={handleWorkPermitFileChange}
      language={(invitation as any)?.language || "en_sv"}
    />
  );
}
