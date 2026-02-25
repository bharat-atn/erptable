import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "sv", label: "Svenska", labelEn: "Swedish", flag: "🇸🇪", file: "/documents/code-of-conduct-sv.pdf" },
  { code: "en", label: "English", labelEn: "English", flag: "🇬🇧", file: "/documents/code-of-conduct-en.pdf" },
  { code: "ro", label: "Română", labelEn: "Romanian", flag: "🇷🇴", file: "/documents/code-of-conduct-ro.pdf" },
  { code: "th", label: "ไทย", labelEn: "Thai", flag: "🇹🇭", file: "/documents/code-of-conduct-th.pdf" },
];

interface CodeOfConductStepProps {
  selectedLanguage: string | null;
  onSelectLanguage: (lang: string) => void;
  reviewed: boolean;
  onSetReviewed: (val: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export function CodeOfConductStep({
  selectedLanguage,
  onSelectLanguage,
  reviewed,
  onSetReviewed,
  onBack,
  onNext,
}: CodeOfConductStepProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Code of Conduct{" "}
          <span className="text-muted-foreground font-normal text-sm">
            / Uppförandekod
          </span>
        </CardTitle>
        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="back" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          {selectedLanguage && (
            <Button onClick={onNext} className="px-8">
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Select the preferred language for the Code of Conduct. The document will be provided to the employee during signing. /
          <span className="italic"> Välj önskat språk för uppförandekoden. Dokumentet tillhandahålls den anställde vid undertecknandet.</span>
        </p>

        {/* Language selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 mb-3 block">
            Select Language / Välj språk
          </label>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onSetReviewed(true);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all",
                  selectedLanguage === lang.code
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <p className="font-semibold text-sm">{lang.label}</p>
                  <p className="text-xs text-muted-foreground">{lang.labelEn}</p>
                </div>
                {selectedLanguage === lang.code && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Open document link */}
        {selectedLanguage && (() => {
          const lang = LANGUAGES.find((l) => l.code === selectedLanguage);
          return lang ? (
            <a
              href={lang.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open document in new tab / Öppna dokument i ny flik
            </a>
          ) : null;
        })()}

      </CardContent>
    </Card>
  );
}
