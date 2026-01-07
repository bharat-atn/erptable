import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ChevronDown, Upload, TreePine } from "lucide-react";
import { z } from "zod";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";

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

const personalInfoSchema = z.object({
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

type PersonalInfo = z.infer<typeof personalInfoSchema>;

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <span className="font-medium text-sm">Section: {title}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 bg-muted/30 border border-t-0 rounded-b-md space-y-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function OnboardingPortal() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<Partial<PersonalInfo>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`*, employees (id, email, first_name, middle_name, last_name, personal_info)`)
        .eq("token", token)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Invitation not found");
      if (data.status === "EXPIRED" || new Date(data.expires_at) < new Date()) {
        throw new Error("This invitation has expired");
      }
      if (data.status === "ACCEPTED") {
        throw new Error("This invitation has already been completed");
      }
      
      // Pre-fill form with existing employee data
      if (data.employees) {
        setFormData((prev) => ({
          ...prev,
          firstName: data.employees.first_name || "",
          middleName: data.employees.middle_name || "",
          lastName: data.employees.last_name || "",
          email: data.employees.email || "",
        }));
      }
      
      return data;
    },
    enabled: !!token && token !== "demo",
  });

  const submitOnboarding = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      const validated = personalInfoSchema.parse(data);

      const { error: empError } = await supabase
        .from("employees")
        .update({
          first_name: validated.firstName,
          middle_name: validated.middleName,
          last_name: validated.lastName,
          personal_info: {
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
            emergencyContact: {
              firstName: validated.emergencyFirstName,
              lastName: validated.emergencyLastName,
              phone: validated.emergencyPhone,
            },
          },
          status: "ONBOARDING",
        })
        .eq("id", invitation?.employees?.id);

      if (empError) throw empError;

      const { error: invError } = await supabase
        .from("invitations")
        .update({ status: "ACCEPTED" })
        .eq("id", invitation?.id);

      if (invError) throw invError;

      const { error: contractError } = await supabase
        .from("contracts")
        .insert({
          employee_id: invitation?.employees?.id,
          season_year: new Date().getFullYear().toString(),
        });

      if (contractError) throw contractError;
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

  const renderForm = (isDemo: boolean = false) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section: Name and Address Information */}
      <Section title="Name and Address Information" defaultOpen={true}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-primary font-medium">First Name *</Label>
            <Input
              value={formData.firstName || ""}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Donald"
              required={!isDemo}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-medium">Middle Name</Label>
            <Input
              value={formData.middleName || ""}
              onChange={(e) => updateField("middleName", e.target.value)}
              placeholder="John"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-primary font-medium">Last Name *</Label>
            <Input
              value={formData.lastName || ""}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Trump"
              required={!isDemo}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-medium">Preferred Name *</Label>
            <Input
              value={formData.preferredName || ""}
              onChange={(e) => updateField("preferredName", e.target.value)}
              placeholder="Donald"
              required={!isDemo}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-primary font-medium">Address 1 *</Label>
            <Input
              value={formData.address1 || ""}
              onChange={(e) => updateField("address1", e.target.value)}
              placeholder="1600 Pennsylvania Ave NW"
              required={!isDemo}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-medium">Address 2</Label>
            <Input
              value={formData.address2 || ""}
              onChange={(e) => updateField("address2", e.target.value)}
              placeholder="The White House"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-primary font-medium">ZIP / Postal Code *</Label>
            <Input
              value={formData.zipCode || ""}
              onChange={(e) => updateField("zipCode", e.target.value)}
              placeholder="20500"
              required={!isDemo}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-medium">City *</Label>
            <Input
              value={formData.city || ""}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Washington, DC"
              required={!isDemo}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-primary font-medium">State / Province *</Label>
            <Input
              value={formData.stateProvince || ""}
              onChange={(e) => updateField("stateProvince", e.target.value)}
              placeholder="Washington, DC"
              required={!isDemo}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-medium">Country *</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => updateField("country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="USA" />
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
      </Section>

      {/* Section: Birth and Contact Information */}
      <Section title="Birth and Contact Information" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-primary font-medium">Birthday *</Label>
          <Input
            type="date"
            value={formData.birthday || ""}
            onChange={(e) => updateField("birthday", e.target.value)}
            required={!isDemo}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-primary font-medium">Country of Birth? *</Label>
          <Select
            value={formData.countryOfBirth}
            onValueChange={(value) => updateField("countryOfBirth", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Romania" />
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
          <Label className="text-primary font-medium">Citizenship? *</Label>
          <Select
            value={formData.citizenship}
            onValueChange={(value) => updateField("citizenship", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Romania" />
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
          <Label className="text-primary font-medium">Mobile Phone Number *</Label>
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
              placeholder=""
              className="flex-1"
              required={!isDemo}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-primary font-medium">Email *</Label>
          <Input
            type="email"
            value={formData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder=""
            required={!isDemo}
          />
        </div>
      </Section>

      {/* Section: Bank Information */}
      <Section title="Bank Information" defaultOpen={true}>
        <div className="space-y-3">
          <Label className="text-primary font-medium">Toggle your Bank</Label>
          <RadioGroup
            value={isOtherBank ? "other" : selectedBank}
            onValueChange={handleBankSelect}
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
            <div className="pt-2">
              <p className="text-sm text-primary font-medium mb-2">
                Toggle here if your bank is not in the list above
              </p>
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
            <Label className="text-primary font-medium">Name the other bank</Label>
            <Input
              value={formData.otherBankName || ""}
              onChange={(e) => updateField("otherBankName", e.target.value)}
              placeholder=""
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-primary font-medium">BIC Code: *</Label>
          <Input
            value={formData.bicCode || ""}
            onChange={(e) => updateField("bicCode", e.target.value)}
            placeholder=""
            required={!isDemo}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-primary font-medium">Your bank account number *</Label>
          <Input
            value={formData.bankAccountNumber || ""}
            onChange={(e) => updateField("bankAccountNumber", e.target.value)}
            placeholder=""
            required={!isDemo}
          />
        </div>
      </Section>

      {/* Section: Emergency Contact Information */}
      <Section title="Emergency Contact Information" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-primary font-medium">Emergency Contact First Name *</Label>
          <Input
            value={formData.emergencyFirstName || ""}
            onChange={(e) => updateField("emergencyFirstName", e.target.value)}
            placeholder="Donald"
            required={!isDemo}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-primary font-medium">Emergency Contact Last Name *</Label>
          <Input
            value={formData.emergencyLastName || ""}
            onChange={(e) => updateField("emergencyLastName", e.target.value)}
            placeholder="Donald"
            required={!isDemo}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-primary font-medium">Emergency Contact Mobile Phone Number *</Label>
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
              placeholder=""
              className="flex-1"
              required={!isDemo}
            />
          </div>
        </div>
      </Section>

      {/* Section: ID / Passport Information */}
      <Section title="ID / Passport Information" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-primary font-medium">
            Please attach your valid EU ID or Passport *
          </Label>
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="id-upload"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="id-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a file or{" "}
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
      </Section>

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={submitOnboarding.isPending}
        >
          {submitOnboarding.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Please submit this form"
          )}
        </Button>
      </div>
    </form>
  );

  // Demo mode
  if (token === "demo") {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="py-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <TreePine className="w-12 h-12 text-primary" />
            </div>
            <p className="text-xl font-semibold text-primary">LJUNGAN FORESTRY</p>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pb-12">
          <p className="text-center text-primary font-medium mb-6">
            Please fill out the following information in full
          </p>
          {renderForm(true)}
        </main>
      </div>
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Onboarding Complete!</h2>
            <p className="text-muted-foreground text-sm">
              Thank you for completing your onboarding. Our HR team will be in touch shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <TreePine className="w-12 h-12 text-primary" />
          </div>
          <p className="text-xl font-semibold text-primary">LJUNGAN FORESTRY</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        <p className="text-center text-primary font-medium mb-6">
          Please fill out the following information in full
        </p>
        {renderForm(false)}
      </main>
    </div>
  );
}
