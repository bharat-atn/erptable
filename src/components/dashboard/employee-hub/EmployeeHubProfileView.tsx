import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Calendar, Globe, CreditCard, Building2, Loader2, Shield } from "lucide-react";

export function EmployeeHubProfileView() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["employee-hub-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  const { data: employee } = useQuery({
    queryKey: ["employee-hub-employee", profile?.email],
    queryFn: async () => {
      if (!profile?.email) return null;
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("email", profile.email)
        .eq("status", "ACTIVE")
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const personalInfo = employee?.personal_info as Record<string, any> | null;
  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-4 px-1 pt-3 pb-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold px-2">My Profile — Min profil</h1>

      {/* Identity Card */}
      <Card className="border-border/60 mx-2">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{profile?.full_name || "—"}</h2>
              <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
              {employee?.employee_code && (
                <Badge variant="outline" className="mt-1 text-xs font-mono">{employee.employee_code}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-border/60 mx-2">
        <CardContent className="pt-5 pb-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth || "—"} />
            <InfoRow icon={Globe} label="Nationality" value={profile?.nationality || "—"} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone_number || employee?.phone || "—"} />
            <InfoRow icon={Mail} label="Email" value={profile?.email || "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Address & Banking */}
      {personalInfo && (
        <>
          <Card className="border-border/60 mx-2">
            <CardContent className="pt-5 pb-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Address
              </h3>
              <div className="space-y-3">
                <InfoRow icon={MapPin} label="Street" value={personalInfo.streetAddress || personalInfo.address || "—"} />
                <InfoRow icon={MapPin} label="City" value={personalInfo.city || employee?.city || "—"} />
                <InfoRow icon={MapPin} label="Postcode" value={personalInfo.postcode || "—"} />
                <InfoRow icon={Globe} label="Country" value={personalInfo.country || employee?.country || "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 mx-2">
            <CardContent className="pt-5 pb-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Bank Details
              </h3>
              <div className="space-y-3">
                <InfoRow icon={Building2} label="Bank" value={personalInfo.bankName || "—"} />
                <InfoRow icon={CreditCard} label="IBAN" value={personalInfo.iban || "—"} />
                <InfoRow icon={CreditCard} label="Account Number" value={personalInfo.accountNumber || "—"} />
                <InfoRow icon={Shield} label="BIC/SWIFT" value={personalInfo.bicSwift || personalInfo.bic || "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 mx-2">
            <CardContent className="pt-5 pb-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Identity Documents
              </h3>
              <div className="space-y-3">
                <InfoRow icon={Shield} label="Passport Number" value={personalInfo.passportNumber || "—"} />
                <InfoRow icon={Shield} label="Personal ID (Sweden)" value={personalInfo.personnummer || personalInfo.personalIdNumber || "—"} />
                <InfoRow icon={Shield} label="Tax ID" value={personalInfo.taxId || "—"} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-h-[44px]">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
