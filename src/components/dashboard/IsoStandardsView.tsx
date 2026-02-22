import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CircleDollarSign, Calendar, Clock, Globe, Flag, Languages, Receipt, Save, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IsoSetting {
  key: string;
  label: string;
  standard: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  description: string;
  options: { value: string; label: string; description: string }[];
}

const DEFAULT_SETTINGS: IsoSetting[] = [
  {
    key: "currency",
    label: "Currency",
    standard: "ISO 4217",
    icon: CircleDollarSign,
    value: "SEK",
    description: "All monetary values are displayed using the ISO 4217 currency code.",
    options: [
      { value: "SEK", label: "SEK (Swedish Krona)", description: "Amounts follow Swedish locale formatting (e.g. 1 234,50 SEK)." },
      { value: "EUR", label: "EUR (Euro)", description: "Amounts follow European formatting (e.g. 1.234,50 EUR)." },
      { value: "USD", label: "USD (US Dollar)", description: "Amounts follow US formatting (e.g. 1,234.50 USD)." },
      { value: "GBP", label: "GBP (British Pound)", description: "Amounts follow UK formatting (e.g. 1,234.50 GBP)." },
      { value: "NOK", label: "NOK (Norwegian Krone)", description: "Amounts follow Norwegian locale formatting." },
      { value: "DKK", label: "DKK (Danish Krone)", description: "Amounts follow Danish locale formatting." },
    ],
  },
  {
    key: "date_format",
    label: "Date Format",
    standard: "ISO 8601",
    icon: Calendar,
    value: "YYYY-MM-DD",
    description: "All dates follow ISO 8601 extended format.",
    options: [
      { value: "YYYY-MM-DD", label: "YYYY-MM-DD", description: "ISO 8601 standard (e.g. 2026-02-13). Default Swedish format." },
      { value: "DD/MM/YYYY", label: "DD/MM/YYYY", description: "European day-first format (e.g. 13/02/2026)." },
      { value: "MM/DD/YYYY", label: "MM/DD/YYYY", description: "US month-first format (e.g. 02/13/2026)." },
      { value: "DD.MM.YYYY", label: "DD.MM.YYYY", description: "German/Central European format (e.g. 13.02.2026)." },
    ],
  },
  {
    key: "time_format",
    label: "Time Format",
    standard: "ISO 8601",
    icon: Clock,
    value: "24h",
    description: "All times use 24-hour notation per ISO 8601.",
    options: [
      { value: "24h", label: "24-hour (HH:mm)", description: "ISO 8601 standard (e.g. 14:30). Timestamps include timezone offset." },
      { value: "12h", label: "12-hour (hh:mm AM/PM)", description: "Anglo-Saxon format (e.g. 2:30 PM)." },
    ],
  },
  {
    key: "timezone",
    label: "Timezone",
    standard: "ISO 8601",
    icon: Globe,
    value: "Europe/Stockholm",
    description: "All timestamps are stored in UTC and displayed in the selected timezone.",
    options: [
      { value: "Europe/Stockholm", label: "CET / CEST (Europe/Stockholm)", description: "Central European Time (CET, UTC+1) or CEST (UTC+2) with daylight saving." },
      { value: "Europe/London", label: "GMT / BST (Europe/London)", description: "Greenwich Mean Time (UTC+0) or British Summer Time (UTC+1)." },
      { value: "Europe/Berlin", label: "CET / CEST (Europe/Berlin)", description: "Central European Time, same offset as Stockholm." },
      { value: "Europe/Helsinki", label: "EET / EEST (Europe/Helsinki)", description: "Eastern European Time (UTC+2) or EEST (UTC+3)." },
      { value: "UTC", label: "UTC", description: "Coordinated Universal Time, no daylight saving." },
    ],
  },
  {
    key: "country_codes",
    label: "Country Codes",
    standard: "ISO 3166-1 alpha-2",
    icon: Flag,
    value: "alpha-2",
    description: "Country references use ISO 3166-1 codes.",
    options: [
      { value: "alpha-2", label: "Alpha-2 (SE, US, GB)", description: "Two-letter codes per ISO 3166-1 (e.g. \"SE\" for Sweden)." },
      { value: "alpha-3", label: "Alpha-3 (SWE, USA, GBR)", description: "Three-letter codes per ISO 3166-1 (e.g. \"SWE\" for Sweden)." },
    ],
  },
  {
    key: "language_codes",
    label: "Language Codes",
    standard: "ISO 639-2",
    icon: Languages,
    value: "639-2",
    description: "Language identifiers use ISO 639 codes. Swedish is the binding legal language.",
    options: [
      { value: "639-2", label: "ISO 639-2 (swe, eng, ron)", description: "Three-letter codes (e.g. \"swe\" for Swedish, \"eng\" for English)." },
      { value: "639-1", label: "ISO 639-1 (sv, en, ro)", description: "Two-letter codes (e.g. \"sv\" for Swedish, \"en\" for English)." },
    ],
  },
  {
    key: "number_format",
    label: "Number Format",
    standard: "ISO 80000-1",
    icon: Hash,
    value: "sv-SE",
    description: "Defines thousand separator and decimal mark per ISO 80000-1. Swedish standard uses thin space as thousand separator and comma as decimal mark.",
    options: [
      { value: "sv-SE", label: "Swedish (1 234,50)", description: "Thin space as thousand separator, comma as decimal mark (ISO 80000-1 recommended)." },
      { value: "en-US", label: "US/UK (1,234.50)", description: "Comma as thousand separator, period as decimal mark." },
      { value: "de-DE", label: "German (1.234,50)", description: "Period as thousand separator, comma as decimal mark." },
      { value: "fr-FR", label: "French (1 234,50)", description: "Thin space as thousand separator, comma as decimal mark (same as Swedish)." },
    ],
  },
  {
    key: "vat",
    label: "VAT (Moms)",
    standard: "ISO 4217 / SE Tax",
    icon: Receipt,
    value: "25",
    description: "All prices are displayed excluding VAT. VAT is calculated and shown separately.",
    options: [
      { value: "25", label: "25% Swedish VAT", description: "Standard Swedish VAT rate per tax law." },
      { value: "12", label: "12% Reduced VAT", description: "Reduced rate for food, hotels, etc." },
      { value: "6", label: "6% Low VAT", description: "Low rate for books, newspapers, cultural events." },
      { value: "0", label: "0% Exempt", description: "VAT exempt transactions." },
    ],
  },
];

const STORAGE_KEY = "iso-standards-settings";

function loadSettings(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function IsoStandardsView() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const saved = loadSettings();
    const defaults: Record<string, string> = {};
    DEFAULT_SETTINGS.forEach((s) => {
      defaults[s.key] = saved[s.key] ?? s.value;
    });
    return defaults;
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setHasChanges(false);
    toast({ title: "ISO standards saved", description: "Your formatting preferences have been updated." });
  };

  const getSelectedOption = (setting: IsoSetting) =>
    setting.options.find((o) => o.value === settings[setting.key]) ?? setting.options[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ISO Standards</h1>
          <p className="text-muted-foreground text-sm">
            International standards enforced across the system
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Compliance banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 py-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base">ISO Compliance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This system enforces international ISO standards across all data formats to ensure consistency, interoperability, and legal compliance within the European market.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Standards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {DEFAULT_SETTINGS.map((setting) => {
          const selected = getSelectedOption(setting);
          const Icon = setting.icon;
          return (
            <Card key={setting.key} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold">{setting.label}</CardTitle>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {setting.standard}
                      </Badge>
                    </div>
                    <p className="text-primary font-medium text-sm mt-0.5">{selected.label}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selected.description}
                </p>
                <Select
                  value={settings[setting.key]}
                  onValueChange={(v) => handleChange(setting.key, v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer note */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Note:</span> These standards are enforced system-wide. All client-facing documents, internal displays, and data exports adhere to the formats listed above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
