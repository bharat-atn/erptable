import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, Globe, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LANGUAGE_OPTIONS, type UiLang } from "@/lib/ui-translations";

interface TimeReportingProfileViewProps {
  t: (key: string) => string;
  lang: UiLang;
  onLanguageChange: (lang: UiLang) => void;
}

export function TimeReportingProfileView({ t, lang, onLanguageChange }: TimeReportingProfileViewProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["tr-profile"],
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
    queryKey: ["tr-employee", profile?.email],
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
    queryClient.invalidateQueries({ queryKey: ["tr-profile"] });
    setSaving(false);
    toast.success(t("hub.languageUpdated"));
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-xl mb-6">
        <h1 className="text-2xl font-bold">{t("hub.myProfile")}</h1>
        <p className="text-sm text-white/80">{t("tr.profileSub")}</p>
      </div>

      {/* Identity Card */}
      <div className="bg-card rounded-2xl border-2 border-orange-500/20 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-orange-100 dark:border-orange-900/30">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-xl font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{profile?.full_name || "—"}</h2>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
            {employee?.employee_code && (
              <Badge variant="outline" className="mt-2 text-xs font-mono border-orange-500/30">{employee.employee_code}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-card rounded-2xl border-2 border-orange-500/20 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Languages className="w-4 h-4" /> {t("hub.language")}
        </h3>
        <Select value={lang} onValueChange={handleLanguageChange} disabled={saving}>
          <SelectTrigger className="w-full min-h-[48px] rounded-xl bg-orange-50 dark:bg-orange-950/10 border-orange-500/20">
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
      <div className="bg-card rounded-2xl border-2 border-orange-500/20 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <User className="w-4 h-4" /> {t("hub.personalInfo")}
        </h3>
        <div className="space-y-2">
          <InfoRow icon={Calendar} label={t("hub.dateOfBirth")} value={profile?.date_of_birth || "—"} />
          <InfoRow icon={Globe} label={t("hub.nationality")} value={profile?.nationality || "—"} />
          <InfoRow icon={Phone} label={t("hub.phone")} value={profile?.phone_number || employee?.phone || "—"} />
          <InfoRow icon={Mail} label={t("hub.email")} value={profile?.email || "—"} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-h-[44px] bg-orange-50 dark:bg-orange-950/10 rounded-xl p-3">
      <Icon className="w-4 h-4 text-orange-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
