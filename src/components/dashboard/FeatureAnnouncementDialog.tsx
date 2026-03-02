import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bug, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ANNOUNCEMENT_ID = "issue-reporter-v1";

const translations: Record<string, { title: string; description: string; lookFor: string; body: string; gotIt: string }> = {
  en: {
    title: "New: Issue Reporter",
    description: "We've added a built-in bug reporting tool to help you report any issues you encounter.",
    lookFor: "Look for this button",
    body: "You'll find a red bug icon in the bottom-right corner of every screen. Click it to report any issues, bugs, or suggestions — we'll take care of the rest.",
    gotIt: "Got it!",
  },
  sv: {
    title: "Nytt: Felrapportering",
    description: "Vi har lagt till ett inbyggt verktyg för felrapportering så att du enkelt kan rapportera problem.",
    lookFor: "Leta efter denna knapp",
    body: "Du hittar en röd bugg-ikon i det nedre högra hörnet på varje skärm. Klicka på den för att rapportera problem, buggar eller förslag — vi tar hand om resten.",
    gotIt: "Uppfattat!",
  },
  ro: {
    title: "Nou: Raportare probleme",
    description: "Am adăugat un instrument integrat de raportare a erorilor pentru a vă ajuta să raportați orice problemă întâmpinați.",
    lookFor: "Căutați acest buton",
    body: "Veți găsi o pictogramă roșie de bug în colțul din dreapta jos al fiecărui ecran. Faceți clic pe ea pentru a raporta orice probleme, erori sau sugestii — noi ne ocupăm de restul.",
    gotIt: "Am înțeles!",
  },
  th: {
    title: "ใหม่: ระบบรายงานปัญหา",
    description: "เราได้เพิ่มเครื่องมือรายงานข้อผิดพลาดในตัวเพื่อช่วยให้คุณรายงานปัญหาที่พบ",
    lookFor: "มองหาปุ่มนี้",
    body: "คุณจะพบไอคอนแมลงสีแดงที่มุมขวาล่างของทุกหน้าจอ คลิกเพื่อรายงานปัญหา ข้อผิดพลาด หรือข้อเสนอแนะ — เราจะดูแลส่วนที่เหลือ",
    gotIt: "เข้าใจแล้ว!",
  },
  uk: {
    title: "Нове: Повідомлення про помилки",
    description: "Ми додали вбудований інструмент для повідомлення про помилки, щоб допомогти вам повідомляти про будь-які проблеми.",
    lookFor: "Шукайте цю кнопку",
    body: "Ви знайдете червону іконку жука в правому нижньому куті кожного екрана. Натисніть на неї, щоб повідомити про проблеми, помилки або пропозиції — ми подбаємо про решту.",
    gotIt: "Зрозуміло!",
  },
};

const LANG_OPTIONS = [
  { value: "en", label: "🇬🇧 EN" },
  { value: "sv", label: "🇸🇪 SV" },
  { value: "ro", label: "🇷🇴 RO" },
  { value: "th", label: "🇹🇭 TH" },
  { value: "uk", label: "🇺🇦 UK" },
];

interface FeatureAnnouncementDialogProps {
  open: boolean;
  onDismiss: () => void;
  userId: string;
  preferredLanguage?: string;
}

export function FeatureAnnouncementDialog({ open, onDismiss, userId, preferredLanguage }: FeatureAnnouncementDialogProps) {
  const [dismissing, setDismissing] = useState(false);
  const [lang, setLang] = useState(() => {
    const pref = preferredLanguage ?? "en";
    return pref in translations ? pref : "en";
  });

  const t = translations[lang] ?? translations.en;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("dismissed_announcements")
        .eq("user_id", userId)
        .single();

      const current = (data as any)?.dismissed_announcements ?? [];
      const updated = Array.isArray(current) ? [...current, ANNOUNCEMENT_ID] : [ANNOUNCEMENT_ID];

      await (supabase as any)
        .from("profiles")
        .update({ dismissed_announcements: updated })
        .eq("user_id", userId);
    } catch (err) {
      console.error("Failed to dismiss announcement:", err);
    }
    sessionStorage.setItem("announcement_dismissed", "1");
    setDismissing(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss(); }}>
      <DialogContent className="max-w-sm" hideDefaultClose onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Language switcher */}
        <div className="flex justify-center">
          <ToggleGroup type="single" value={lang} onValueChange={(v) => { if (v) setLang(v); }} size="sm" className="gap-0.5">
            {LANG_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Bug className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                {t.lookFor}
                <ArrowDownRight className="inline ml-1 h-4 w-4 text-muted-foreground" />
              </p>
              <p className="text-muted-foreground">{t.body}</p>
            </div>
          </div>

          <Button className="w-full" onClick={handleDismiss} disabled={dismissing}>
            {t.gotIt}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ANNOUNCEMENT_ID };
