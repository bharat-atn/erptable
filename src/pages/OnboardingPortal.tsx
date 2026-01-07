import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { z } from "zod";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().min(10, "Valid phone number required").max(20),
  address: z.string().min(5, "Address is required").max(500),
  emergencyContact: z.string().max(200).optional(),
  bankAccount: z.string().max(50).optional(),
  taxNumber: z.string().max(50).optional(),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;

export default function OnboardingPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<PersonalInfo>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`*, employees (id, email, first_name, last_name, personal_info)`)
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
      
      return data;
    },
    enabled: !!token,
  });

  const submitOnboarding = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      // Validate data
      const validated = personalInfoSchema.parse(data);

      // Update employee with personal info
      const { error: empError } = await supabase
        .from("employees")
        .update({
          first_name: validated.firstName,
          last_name: validated.lastName,
          personal_info: {
            phone: validated.phone,
            address: validated.address,
            emergencyContact: validated.emergencyContact,
            // In production, these would be encrypted
            bankAccount: validated.bankAccount,
            taxNumber: validated.taxNumber,
          },
          status: "ONBOARDING",
        })
        .eq("id", invitation?.employees?.id);

      if (empError) throw empError;

      // Update invitation status
      const { error: invError } = await supabase
        .from("invitations")
        .update({ status: "ACCEPTED" })
        .eq("id", invitation?.id);

      if (invError) throw invError;

      // Create a contract record
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
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = personalInfoSchema.parse(formData);
      submitOnboarding.mutate(validated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    }
  };

  const updateField = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="font-display text-xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground">
              {(error as Error)?.message || "This invitation link is not valid."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large animate-fade-up">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Onboarding Complete!</h2>
            <p className="text-muted-foreground">
              Thank you for completing your onboarding. Our HR team will be in touch shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero py-8 px-4">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">OnboardFlow HR</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome to the Team!
          </h1>
          <p className="opacity-90">
            Please complete your onboarding information below
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8 -mt-4">
        <Card className="shadow-large animate-fade-up">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              For: {invitation.employees?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={(e) => updateField("emergencyContact", e.target.value)}
                  placeholder="Name - Relationship - Phone"
                />
              </div>

              {/* Sensitive Info */}
              <div className="border-t pt-6">
                <h3 className="font-display font-semibold mb-4">Financial Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount || ""}
                      onChange={(e) => updateField("bankAccount", e.target.value)}
                      placeholder="••••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Tax ID / SSN</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber || ""}
                      onChange={(e) => updateField("taxNumber", e.target.value)}
                      placeholder="••••••••••"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your financial information is encrypted and stored securely.
                </p>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={submitOnboarding.isPending}
              >
                {submitOnboarding.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Onboarding
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
