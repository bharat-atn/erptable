import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Globe, Star, ArrowLeft } from "lucide-react";

interface LanguageOption {
  code: string;
  label: string;
  favorite?: boolean;
}

const FAVORITES: LanguageOption[] = [
  { code: "EN/SE", label: "English/Swedish", favorite: true },
];

const EUROPEAN_LANGUAGES: LanguageOption[] = [
  { code: "SE", label: "Swedish" },
  { code: "RO/SE", label: "Romanian/Swedish" },
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
];

const OTHER_LANGUAGES: LanguageOption[] = [
  { code: "TH/SE", label: "Thai/Swedish" },
  { code: "ZH/SE", label: "Chinese/Swedish" },
];

interface LanguageSelectionStepProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onBack: () => void;
}

export function LanguageSelectionStep({
  selectedLanguage,
  onSelectLanguage,
  onBack,
}: LanguageSelectionStepProps) {
  const renderCard = (lang: LanguageOption) => {
    const isSelected = selectedLanguage === lang.code;
    return (
      <button
        key={lang.code}
        onClick={() => onSelectLanguage(lang.code)}
        className={cn(
          "relative flex flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5",
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-background"
        )}
      >
        <span className="font-bold text-sm">{lang.code}</span>
        <span className="text-xs text-muted-foreground">{lang.label}</span>
        {lang.favorite && (
          <Star className="absolute top-2 right-2 w-3.5 h-3.5 text-primary fill-primary" />
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
          Choose the primary language for the contract (English is always included)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Favorites */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            Favorites
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {FAVORITES.map(renderCard)}
          </div>
        </div>

        {/* European Languages */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            European Languages
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {EUROPEAN_LANGUAGES.map(renderCard)}
          </div>
        </div>

        {/* Other Languages */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            Other Languages
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {OTHER_LANGUAGES.map(renderCard)}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

