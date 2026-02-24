import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Globe, Star, ArrowLeft, Check } from "lucide-react";

interface LanguageOption {
  code: string;
  label: string;
  translated?: boolean; // actually translated & available
}

/** Languages that have actual contract translations ready */
const TRANSLATED_CODES = new Set(["EN/SE", "SE", "RO/SE", "TH/SE"]);

const ALL_LANGUAGES: LanguageOption[] = [
  { code: "EN/SE", label: "English/Swedish" },
  { code: "SE", label: "Swedish" },
  { code: "RO/SE", label: "Romanian/Swedish" },
  { code: "TH/SE", label: "Thai/Swedish" },
  { code: "PL/SE", label: "Polish/Swedish" },
  { code: "UK/SE", label: "Ukrainian/Swedish" },
  { code: "LT/SE", label: "Lithuanian/Swedish" },
  { code: "LV/SE", label: "Latvian/Swedish" },
  { code: "ET/SE", label: "Estonian/Swedish" },
  { code: "DE/SE", label: "German/Swedish" },
  { code: "ES/SE", label: "Spanish/Swedish" },
  { code: "FR/SE", label: "French/Swedish" },
  { code: "IT/SE", label: "Italian/Swedish" },
  { code: "NL/SE", label: "Dutch/Swedish" },
  { code: "PT/SE", label: "Portuguese/Swedish" },
  { code: "FI/SE", label: "Finnish/Swedish" },
  { code: "DA/SE", label: "Danish/Swedish" },
  { code: "NO/SE", label: "Norwegian/Swedish" },
  { code: "BG/SE", label: "Bulgarian/Swedish" },
  { code: "HR/SE", label: "Croatian/Swedish" },
  { code: "CS/SE", label: "Czech/Swedish" },
  { code: "EL/SE", label: "Greek/Swedish" },
  { code: "HU/SE", label: "Hungarian/Swedish" },
  { code: "SK/SE", label: "Slovak/Swedish" },
  { code: "SL/SE", label: "Slovenian/Swedish" },
  { code: "ZH/SE", label: "Chinese/Swedish" },
].map((l) => ({ ...l, translated: TRANSLATED_CODES.has(l.code) }));

const STORAGE_KEY = "contract-language-favorites";
const DEFAULT_FAVORITES = ["EN/SE"];

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_FAVORITES;
}

function saveFavorites(codes: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

interface LanguageSelectionStepProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onBack: () => void;
  onNext?: () => void;
}

export function LanguageSelectionStep({
  selectedLanguage,
  onSelectLanguage,
  onBack,
  onNext,
}: LanguageSelectionStepProps) {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const favoriteLanguages = ALL_LANGUAGES.filter((l) =>
    favorites.includes(l.code)
  );
  const nonFavoriteTranslated = ALL_LANGUAGES.filter(
    (l) => l.translated && !favorites.includes(l.code)
  );
  const otherLanguages = ALL_LANGUAGES.filter(
    (l) => !l.translated && !favorites.includes(l.code)
  );

  const renderCard = (lang: LanguageOption) => {
    const isSelected = selectedLanguage === lang.code;
    const isFav = favorites.includes(lang.code);
    return (
      <button
        key={lang.code}
        onClick={() => lang.translated ? onSelectLanguage(lang.code) : undefined}
        disabled={!lang.translated}
        className={cn(
          "relative flex flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-all",
          lang.translated
            ? "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            : "opacity-50 cursor-not-allowed",
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-background"
        )}
      >
        <div className="flex w-full items-center justify-between">
          <span className="font-bold text-sm">{lang.code}</span>
          <button
            type="button"
            onClick={(e) => toggleFavorite(lang.code, e)}
            className="p-0.5 rounded hover:bg-muted transition-colors"
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                isFav
                  ? "text-primary fill-primary"
                  : "text-muted-foreground/40 hover:text-primary/60"
              )}
            />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">{lang.label}</span>
        {lang.translated && (
          <span className="absolute bottom-1.5 right-2">
            <Check className="w-3 h-3 text-green-600" />
          </span>
        )}
        {!lang.translated && (
          <span className="text-[10px] text-muted-foreground/60 italic">
            Coming soon
          </span>
        )}
      </button>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Select Language{" "}
          <span className="text-muted-foreground font-normal text-sm">
            / Välj språk
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose the contract language. Click the <Star className="w-3 h-3 inline fill-primary text-primary" /> to add/remove favorites.
        </p>
        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {onNext && selectedLanguage && (
            <Button onClick={onNext} className="px-8">
              Next
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Favorites */}
        {favoriteLanguages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              Favorites
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {favoriteLanguages.map(renderCard)}
            </div>
          </div>
        )}

        {/* Translated / Available */}
        {nonFavoriteTranslated.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
              Available Translations
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {nonFavoriteTranslated.map(renderCard)}
            </div>
          </div>
        )}

        {/* Not yet translated */}
        {otherLanguages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Coming Soon
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {otherLanguages.map(renderCard)}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
