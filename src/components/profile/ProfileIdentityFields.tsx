/**
 * Shared profile identity fields used in both LoginProfileDialog and Sidebar UserProfileDialog.
 */
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { LANGUAGE_OPTIONS, type UiLang } from "@/lib/ui-translations";
import { getOrderedNationalities, getFlagForCountry } from "@/lib/nationalities";
import {
  getIsoDateFormat,
  formatDateForDisplay,
  parseDateToCanonical,
  getOrderedCountries,
} from "@/lib/profile-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Validation types ────────────────────────────────────────────
export interface FieldValidation {
  valid: boolean;
  message: string;
}
export interface ValidationResult {
  phone: FieldValidation;
  nationality: FieldValidation;
  dateOfBirth: FieldValidation;
}

// ─── Props ───────────────────────────────────────────────────────
export interface ProfileData {
  fullName: string;
  avatarUrl: string | null;
  lang: UiLang;
  /** Canonical yyyy-MM-dd */
  dateOfBirth: string;
  dialCode: string;
  localNumber: string;
  nationality: string;
}

interface ProfileIdentityFieldsProps {
  userId: string;
  userEmail: string;
  data: ProfileData;
  onChange: (patch: Partial<ProfileData>) => void;
  /** If provided, show validation icons/messages per field */
  validation?: ValidationResult | null;
  /** Called when any validated field changes (to reset validation) */
  onFieldChange?: () => void;
  /** Whether to show the avatar upload section */
  showAvatar?: boolean;
}

export function ProfileIdentityFields({
  userId,
  userEmail,
  data,
  onChange,
  validation,
  onFieldChange,
  showAvatar = true,
}: ProfileIdentityFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isoDateFormat = getIsoDateFormat();
  const orderedCountries = getOrderedCountries();
  const orderedNationalities = getOrderedNationalities();

  // Date display value (from canonical)
  const displayDate = formatDateForDisplay(data.dateOfBirth, isoDateFormat);

  const handleDateChange = (displayVal: string) => {
    // Try to parse to canonical immediately
    const canonical = parseDateToCanonical(displayVal, isoDateFormat);
    onChange({ dateOfBirth: canonical });
    onFieldChange?.();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setUploading(true);
    const path = `avatars/${userId}.png`;
    const { error } = await supabase.storage.from("signatures").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    await (supabase as any).from("profiles").update({ avatar_url: url }).eq("user_id", userId);
    onChange({ avatarUrl: url });
    setUploading(false);
  };

  const ValidationIcon = ({ field }: { field?: FieldValidation }) => {
    if (!field) return null;
    return field.valid ? (
      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
    );
  };

  const ValidationMsg = ({ field }: { field?: FieldValidation }) => {
    if (!field) return null;
    return (
      <p className={`text-[10px] ${field.valid ? "text-success" : "text-destructive"}`}>
        {field.message}
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {/* Avatar */}
      {showAvatar && (
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14">
            {data.avatarUrl && <AvatarImage src={data.avatarUrl} />}
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
      )}

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Full Name</Label>
        <Input value={data.fullName} onChange={(e) => onChange({ fullName: e.target.value })} />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Email</Label>
        <Input value={userEmail} disabled className="opacity-60" />
      </div>

      {/* Language */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Preferred Language</Label>
        <Select value={data.lang} onValueChange={(v) => { onChange({ lang: v as UiLang }); onFieldChange?.(); }}>
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
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Date of Birth</Label>
          <ValidationIcon field={validation?.dateOfBirth} />
        </div>
        <Input
          type="text"
          value={displayDate}
          onChange={(e) => handleDateChange(e.target.value)}
          placeholder={isoDateFormat}
          maxLength={10}
        />
        {data.dateOfBirth && data.dateOfBirth !== displayDate && (
          <p className="text-[10px] text-muted-foreground">Stored: {data.dateOfBirth}</p>
        )}
        <ValidationMsg field={validation?.dateOfBirth} />
      </div>

      {/* Phone Number */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Phone Number</Label>
          <ValidationIcon field={validation?.phone} />
        </div>
        <div className="flex gap-2">
          <Select value={data.dialCode} onValueChange={(v) => { onChange({ dialCode: v }); onFieldChange?.(); }}>
            <SelectTrigger className="w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderedCountries.priority.map((c) => (
                <SelectItem key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</SelectItem>
              ))}
              <Separator className="my-1" />
              {orderedCountries.rest.map((c) => (
                <SelectItem key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={data.localNumber}
            onChange={(e) => { onChange({ localNumber: e.target.value }); onFieldChange?.(); }}
            placeholder="70 123 4567"
            className="flex-1"
          />
        </div>
        <ValidationMsg field={validation?.phone} />
      </div>

      {/* Nationality */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Nationality</Label>
          <ValidationIcon field={validation?.nationality} />
        </div>
        <Select value={data.nationality} onValueChange={(v) => { onChange({ nationality: v }); onFieldChange?.(); }}>
          <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
          <SelectContent>
            {orderedNationalities.priority.map((n) => (
              <SelectItem key={n.nationality} value={n.nationality}>
                {getFlagForCountry(n.country)} {n.nationality}
              </SelectItem>
            ))}
            <Separator className="my-1" />
            {orderedNationalities.rest.map((n) => (
              <SelectItem key={n.nationality} value={n.nationality}>
                {getFlagForCountry(n.country)} {n.nationality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ValidationMsg field={validation?.nationality} />
      </div>
    </div>
  );
}
