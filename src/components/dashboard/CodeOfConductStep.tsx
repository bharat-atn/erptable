import { useState } from "react";
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
  const [pdfOpen, setPdfOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.code === selectedLanguage);

  const handleOpenDocument = () => {
    if (!selected) return;
    window.open(selected.file, "_blank");
    // Mark as reviewed once they open the document
    onSetReviewed(true);
  };

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
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          The employee must review the Code of Conduct before signing the employment contract. 
          Select the preferred language and open the document to review. /
          <span className="italic"> Den anställde måste granska uppförandekoden innan anställningsavtalet undertecknas. 
          Välj önskat språk och öppna dokumentet för granskning.</span>
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
                  onSetReviewed(false);
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

        {/* Document viewer */}
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                Document / Dokument
              </label>
              {reviewed && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="w-3.5 h-3.5" />
                  Reviewed / Granskad
                </span>
              )}
            </div>
            
            {/* Embedded PDF viewer */}
            <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
              <iframe
                src={selected.file}
                className="w-full h-[500px]"
                title={`Code of Conduct - ${selected.labelEn}`}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDocument}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab / Öppna i ny flik
              </Button>
              {!reviewed && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSetReviewed(true)}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark as reviewed / Markera som granskad
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          {reviewed && (
            <Button onClick={onNext} className="px-8">
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
