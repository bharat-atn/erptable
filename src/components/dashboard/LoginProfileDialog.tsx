import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logoutWithAudit } from "@/lib/audit-helpers";
import { type UiLang } from "@/lib/ui-translations";
import { toast } from "sonner";
import {
  parsePhone,
  combinePhone,
  LANG_DEFAULTS,
  AUTO_SET_NATIONALITIES,
  isProfileIdentityComplete,
} from "@/lib/profile-utils";
import {
  ProfileIdentityFields,
  type ProfileData,
  type ValidationResult,
} from "@/components/profile/ProfileIdentityFields";

// --- Validation fingerprint helpers (v2 = strict required fields) ---
const VALIDATION_KEY_PREFIX = "profile-validation-v2-";

function buildFingerprint(data: ProfileData): string {
  return `${data.dialCode}|${data.localNumber}|${data.nationality}|${data.lang}|${data.dateOfBirth}`;
}

function loadCachedValidation(userId: string, fingerprint: string): ValidationResult | null {
  try {
    const raw = localStorage.getItem(`${VALIDATION_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.fingerprint === fingerprint) return cached.validation as ValidationResult;
  } catch {}
  return null;
}

function saveCachedValidation(userId: string, fingerprint: string, validation: ValidationResult) {
  localStorage.setItem(`${VALIDATION_KEY_PREFIX}${userId}`, JSON.stringify({ fingerprint, validation }));
}

interface LoginProfileDialogProps {
  open: boolean;
  onContinue: () => void;
  userId: string;
  userEmail: string;
}

export function LoginProfileDialog({ open, onContinue, userId, userEmail }: LoginProfileDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skipOnLogin, setSkipOnLogin] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    avatarUrl: null,
    lang: "en",
    dateOfBirth: "",
    dialCode: "+46",
    localNumber: "",
    nationality: "",
  });

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, preferred_language, date_of_birth, phone_number, nationality, skip_login_profile")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        const p = data as any;
        if (p) {
          const profileLang = (p.preferred_language as UiLang) ?? "en";
          const { dialCode: dc, localNumber: ln } = parsePhone(p.phone_number ?? "");
          const existingNat = p.nationality ?? "";
          const mapping = LANG_DEFAULTS[profileLang];

          const newData: ProfileData = {
            fullName: p.full_name ?? "",
            avatarUrl: p.avatar_url ?? null,
            lang: profileLang,
            dateOfBirth: p.date_of_birth ?? "",
            dialCode: existingNat ? dc : (mapping?.dialCode ?? dc),
            localNumber: ln,
            nationality: existingNat || mapping?.nationality || "",
          };
          setProfileData(newData);
          setSkipOnLogin(p.skip_login_profile ?? false);

          // Check cached validation
          const fp = buildFingerprint(newData);
          const cached = loadCachedValidation(userId, fp);
          if (cached) setValidation(cached);
        }
        setLoading(false);
      });
  }, [open, userId]);

  const handleChange = useCallback((patch: Partial<ProfileData>) => {
    setProfileData((prev) => {
      const next = { ...prev, ...patch };
      // Auto-set nationality + dialCode when language changes
      if (patch.lang) {
        const mapping = LANG_DEFAULTS[patch.lang];
        if (mapping) {
          if (!prev.nationality || AUTO_SET_NATIONALITIES.includes(prev.nationality)) {
            next.nationality = mapping.nationality;
          }
          next.dialCode = mapping.dialCode;
        }
      }
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(() => {
    setValidation(null);
  }, []);

  // AI validation
  const handleValidate = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-profile-fields", {
        body: {
          dialCode: profileData.dialCode,
          localNumber: profileData.localNumber,
          nationality: profileData.nationality,
          preferredLanguage: profileData.lang,
          dateOfBirth: profileData.dateOfBirth,
        },
      });
      if (error) throw error;
      if (data?.fields) {
        const result = data.fields as ValidationResult;
        setValidation(result);
        const allValid = result.phone.valid && result.dateOfBirth.valid;
        if (allValid) {
          const fp = buildFingerprint(profileData);
          saveCachedValidation(userId, fp, result);
        }
      }
    } catch (err) {
      console.error("Validation failed:", err);
      toast.error("Validation service unavailable");
    } finally {
      setValidating(false);
    }
  };

  const requiredComplete = isProfileIdentityComplete(profileData);
  const hasErrors = validation && (!validation.phone.valid || !validation.dateOfBirth.valid || !validation.nationality.valid);
  const validationPassed = validation && !hasErrors;
  const needsValidation = !validation;

  const handleContinue = async () => {
    if (!validationPassed) return;
    setSaving(true);
    await (supabase as any).from("profiles").update({
      full_name: profileData.fullName || null,
      preferred_language: profileData.lang,
      date_of_birth: profileData.dateOfBirth || null,
      phone_number: combinePhone(profileData.dialCode, profileData.localNumber),
      nationality: profileData.nationality || null,
      skip_login_profile: skipOnLogin,
    }).eq("user_id", userId);
    setSaving(false);
    onContinue();
  };

  const handleClose = async () => {
    await logoutWithAudit();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent
        className="max-w-md"
        hideDefaultClose
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Explicit close button — always visible, high contrast */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-sm p-1 bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close and sign out"
        >
          <X className="h-4 w-4" />
        </button>

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
            <ProfileIdentityFields
              userId={userId}
              userEmail={userEmail}
              data={profileData}
              onChange={handleChange}
              validation={validation}
              onFieldChange={handleFieldChange}
              showAvatar
            />

            {/* Validate button */}
            <Button
              variant={needsValidation ? "destructive" : "outline"}
              size="sm"
              className={`w-full ${needsValidation && requiredComplete ? "animate-pulse" : ""}`}
              onClick={handleValidate}
              disabled={validating || !requiredComplete}
            >
              {validating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              )}
              {validating ? "Validating…" : !requiredComplete ? "Fill required fields first" : needsValidation ? "⚠ Validate Fields" : "Validate Fields"}
            </Button>

            {/* Don't show again toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground">Don't show this on login</Label>
              <Switch checked={skipOnLogin} onCheckedChange={setSkipOnLogin} />
            </div>

            <Button className="w-full" onClick={handleContinue} disabled={!requiredComplete || !validationPassed || saving || validating}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
