import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGE_OPTIONS, type UiLang } from "@/lib/ui-translations";
import { toast } from "sonner";

interface LoginProfileDialogProps {
  open: boolean;
  onContinue: () => void;
  userId: string;
  userEmail: string;
}

export function LoginProfileDialog({ open, onContinue, userId, userEmail }: LoginProfileDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lang, setLang] = useState<UiLang>("en");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [nationality, setNationality] = useState("");
  const [skipOnLogin, setSkipOnLogin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !userId) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, preferred_language, date_of_birth, phone_number, emergency_contact, nationality, skip_login_profile")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        const p = data as any;
        if (p) {
          setFullName(p.full_name ?? "");
          setAvatarUrl(p.avatar_url ?? null);
          setLang((p.preferred_language as UiLang) ?? "en");
          setDateOfBirth(p.date_of_birth ?? "");
          setPhoneNumber(p.phone_number ?? "");
          setEmergencyContact(p.emergency_contact ?? "");
          setNationality(p.nationality ?? "");
          setSkipOnLogin(p.skip_login_profile ?? false);
        }
        setLoading(false);
      });
  }, [open, userId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setUploading(true);
    const path = `avatars/${userId}.png`;
    const { error } = await supabase.storage.from("signatures").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("signatures").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await (supabase as any).from("profiles").update({ avatar_url: url }).eq("user_id", userId);
    setAvatarUrl(url);
    setUploading(false);
  };

  const handleContinue = async () => {
    setSaving(true);
    await (supabase as any).from("profiles").update({
      full_name: fullName || null,
      preferred_language: lang,
      date_of_birth: dateOfBirth || null,
      phone_number: phoneNumber || null,
      emergency_contact: emergencyContact || null,
      nationality: nationality || null,
      skip_login_profile: skipOnLogin,
    }).eq("user_id", userId);
    setSaving(false);
    onContinue();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome Back</DialogTitle>
          <DialogDescription>Review your profile before continuing</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="bg-muted"><Camera className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Upload Avatar
                </Button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={userEmail} disabled className="opacity-60" />
            </div>

            {/* Language */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preferred Language</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as UiLang)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.flag} {opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date of Birth</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Phone Number</Label>
              <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+46 70 123 4567" />
            </div>

            {/* Emergency Contact */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Emergency Contact</Label>
              <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Name & phone number" />
            </div>

            {/* Nationality */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nationality</Label>
              <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Swedish" />
            </div>

            {/* Don't show again toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground">Don't show this on login</Label>
              <Switch checked={skipOnLogin} onCheckedChange={setSkipOnLogin} />
            </div>

            <Button className="w-full" onClick={handleContinue} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
