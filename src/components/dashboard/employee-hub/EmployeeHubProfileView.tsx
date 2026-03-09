import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Calendar, Globe, CreditCard, Building2, Loader2, Shield, Languages } from "lucide-react";
import { toast } from "sonner";
import { LANGUAGE_OPTIONS, type UiLang } from "@/lib/ui-translations";

interface EmployeeHubProfileViewProps {
  t: (key: string) => string;
  lang: UiLang;
  onLanguageChange: (lang: UiLang) => void;
}

export function EmployeeHubProfileView({ t, lang, onLanguageChange }: EmployeeHubProfileViewProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

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

  const handleLanguageChange = async (newLang: string) => {
    setSaving(true);
    onLanguageChange(newLang as UiLang);
    queryClient.invalidateQueries({ queryKey: ["employee-hub-profile"] });
    setSaving(false);
    toast.success(t("hub.languageUpdated"));
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const personalInfo = employee?.personal_info as Record<string, any> | null;
  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-4 px-2 pt-2 pb-24 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl mb-6">
        <h1 className="text-2xl font-bold">{t("hub.myProfile")}</h1>
        <p className="text-sm text-white/80">{t("hub.myProfileSub")}</p>
      </div>

      {/* Identity Card */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-emerald-100 dark:border-emerald-900/30">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-xl font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{profile?.full_name || "—"}</h2>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
            {employee?.employee_code && (
              <Badge variant="outline" className="mt-2 text-xs font-mono border-emerald-600/30">{employee.employee_code}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Languages className="w-4 h-4" /> {t("hub.language")}
        </h3>
        <Select value={lang} onValueChange={handleLanguageChange} disabled={saving}>
          <SelectTrigger className="w-full min-h-[48px] rounded-xl bg-emerald-50 dark:bg-emerald-950/10 border-emerald-600/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((l) => (
              <SelectItem key={l.value} value={l.value} className="min-h-[44px]">
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-base">{l.flag}</span>
                  {l.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <User className="w-4 h-4" /> {t("hub.personalInfo")}
        </h3>
        <div className="space-y-2">
          <InfoRow icon={Calendar} label={t("hub.dateOfBirth")} value={profile?.date_of_birth || "—"} />
          <InfoRow icon={Globe} label={t("hub.nationality")} value={profile?.nationality || "—"} />
          <InfoRow icon={Phone} label={t("hub.phone")} value={profile?.phone_number || employee?.phone || "—"} />
          <InfoRow icon={Mail} label={t("hub.email")} value={profile?.email || "—"} />
        </div>
      </div>

      {/* Address & Banking */}
      {personalInfo && (
        <>
          <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <MapPin className="w-4 h-4" /> {t("hub.address")}
            </h3>
            <div className="space-y-2">
              <InfoRow icon={MapPin} label={t("hub.street")} value={personalInfo.streetAddress || personalInfo.address || "—"} />
              <InfoRow icon={MapPin} label={t("hub.city")} value={personalInfo.city || employee?.city || "—"} />
              <InfoRow icon={MapPin} label={t("hub.postcode")} value={personalInfo.postcode || "—"} />
              <InfoRow icon={Globe} label={t("hub.country")} value={personalInfo.country || employee?.country || "—"} />
            </div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <CreditCard className="w-4 h-4" /> {t("hub.bankDetails")}
            </h3>
            <div className="space-y-2">
              <InfoRow icon={Building2} label={t("hub.bank")} value={personalInfo.bankName || "—"} />
              <InfoRow icon={CreditCard} label={t("hub.iban")} value={personalInfo.iban || "—"} />
              <InfoRow icon={CreditCard} label={t("hub.accountNumber")} value={personalInfo.accountNumber || "—"} />
              <InfoRow icon={Shield} label={t("hub.bicSwift")} value={personalInfo.bicSwift || personalInfo.bic || "—"} />
            </div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <Shield className="w-4 h-4" /> {t("hub.identityDocs")}
            </h3>
            <div className="space-y-2">
              <InfoRow icon={Shield} label={t("hub.passportNumber")} value={personalInfo.passportNumber || "—"} />
              <InfoRow icon={Shield} label={t("hub.personalId")} value={personalInfo.personnummer || personalInfo.personalIdNumber || "—"} />
              <InfoRow icon={Shield} label={t("hub.taxId")} value={personalInfo.taxId || "—"} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-h-[44px] bg-emerald-50 dark:bg-emerald-950/10 rounded-xl p-3">
      <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
