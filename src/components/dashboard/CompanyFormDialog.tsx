import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { countries, findCountryByName, type Country } from "@/lib/countries";
import { validatePostcodeFormat, postcodePatterns } from "@/lib/postcode-patterns";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown, AlertCircle, CheckCircle2, Loader2, Sparkles, Search, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Validation ──────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200, "Max 200 characters"),
  org_number: z.string().trim()
    .refine((v) => !v || /^[\d\s\-\.]+$/.test(v), "Organization number must contain only digits, spaces, hyphens, or dots")
    .refine((v) => !v || v.replace(/[\s\-\.]/g, "").length >= 6, "Minimum 6 digits required"),
  address: z.string().trim().max(300, "Max 300 characters").optional().or(z.literal("")),
  postcode: z.string().trim().max(20, "Max 20 characters").optional().or(z.literal("")),
  city: z.string().trim().max(100, "Max 100 characters").optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim()
    .refine((v) => !v || /^[\d\s\-\+\(\)]+$/.test(v), "Phone must contain only digits, spaces, hyphens, +, or parentheses")
    .refine((v) => !v || v.replace(/[\s\-\+\(\)]/g, "").length >= 5, "Phone number too short"),
  email: z.string().trim()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email address"),
  website: z.string().trim()
    .refine((v) => !v || /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[^\s]*$/.test(v), "Invalid website URL (e.g. www.example.com)"),
});

export interface CompanyFormData {
  name: string;
  org_number: string;
  address: string;
  postcode: string;
  city: string;
  phone: string;
  email: string;
  country: string;
  website: string;
}

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (company: CompanyFormData) => void;
  initialData?: (CompanyFormData & { id?: string }) | null;
}

const initialForm: CompanyFormData = {
  name: "", org_number: "", address: "", postcode: "",
  city: "", phone: "", email: "", country: "", website: "",
};

// ─── Field Error Indicator ───────────────────────────────────────

function FieldMessage({ error, valid, info, loading, autoFilled, source, confidence }: { error?: string; valid?: boolean; info?: string; loading?: boolean; autoFilled?: boolean; source?: string; confidence?: string }) {
  if (loading) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 animate-fade-in">
        <Loader2 className="w-3 h-3 shrink-0 animate-spin" /> Verifying...
      </p>
    );
  }
  if (error) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-destructive mt-1 animate-fade-in">
        <AlertCircle className="w-3 h-3 shrink-0" /> {error}
      </p>
    );
  }
  if (info) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-primary mt-1 animate-fade-in">
        <Sparkles className="w-3 h-3 shrink-0" /> {info}
      </p>
    );
  }
  if (autoFilled && source) {
    const isVerified = source.includes("allabolag") || source.includes("Bolagsverket") || source.includes("registry") || source.includes("hitta.se") || source.includes("Skatteverket");
    const isNotFound = source.includes("Not found");
    return (
      <div className="mt-1 animate-fade-in space-y-0.5">
        {isNotFound ? (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldX className="w-3 h-3 shrink-0" /> Not found in registry — please fill manually
          </p>
        ) : isVerified ? (
          <p className="flex items-center gap-1 text-[11px] text-success">
            <ShieldCheck className="w-3 h-3 shrink-0" /> Verified from {source}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-[11px] text-warning">
            <ShieldAlert className="w-3 h-3 shrink-0" /> Unverified — {source}
          </p>
        )}
      </div>
    );
  }
  if (autoFilled) {
    return (
      <div className="mt-1 animate-fade-in">
        <p className="flex items-center gap-1 text-[11px] text-primary">
          <Sparkles className="w-3 h-3 shrink-0" /> Auto-filled
        </p>
      </div>
    );
  }
  if (valid) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-success mt-1 animate-fade-in">
        <CheckCircle2 className="w-3 h-3 shrink-0" /> Looks good
      </p>
    );
  }
  return null;
}

// ─── Country Combobox ────────────────────────────────────────────

function CountryCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return countries;
    const term = search.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    );
  }, [search]);

  const selected = findCountryByName(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-base">{selected.flag}</span> {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select country...</span>
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-50 bg-popover" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        <ScrollArea className="h-[250px]">
          <div className="p-1">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground p-3 text-center">No country found</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors",
                  value === c.name && "bg-accent"
                )}
                onClick={() => {
                  onChange(c.name);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="text-base w-5">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                {value === c.name && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Phone Prefix Selector ───────────────────────────────────────

function PhonePrefixInput({
  value, onChange, dialCode, onDialCodeChange,
}: {
  value: string;
  onChange: (v: string) => void;
  dialCode: string;
  onDialCodeChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return countries;
    const term = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.dialCode.includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [search]);

  const selectedCountry = countries.find((c) => c.dialCode === dialCode);

  return (
    <div className="flex gap-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="rounded-r-none border-r-0 px-2.5 h-10 min-w-[90px] font-normal gap-1"
          >
            <span className="text-base">{selectedCountry?.flag || "🌐"}</span>
            <span className="text-xs text-muted-foreground">{dialCode || "+?"}</span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 z-50 bg-popover" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Search by country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ScrollArea className="h-[250px]">
            <div className="p-1">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors",
                    dialCode === c.dialCode && "bg-accent"
                  )}
                  onClick={() => {
                    onDialCodeChange(c.dialCode);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="text-base w-5">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.dialCode}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-l-none flex-1"
        placeholder="Phone number"
      />
    </div>
  );
}

// ─── Main Form Dialog ────────────────────────────────────────────

export function CompanyFormDialog({
  open, onOpenChange, onSubmit, initialData,
}: CompanyFormDialogProps) {
  const [form, setForm] = useState<CompanyFormData>(initialForm);
  const [dialCode, setDialCode] = useState("+46");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [aiValidation, setAiValidation] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ warnings?: string[]; message?: string; confidence?: Record<string, string>; sources?: Record<string, string>; verified?: boolean } | null>(null);
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Company lookup - auto-fill form from AI
  const runCompanyLookup = useCallback(async (name: string, org_number: string) => {
    if (!name.trim()) return;
    // If org number is provided, need at least 6 digit chars
    if (org_number.trim()) {
      const digitCount = org_number.replace(/[\s\-\.]/g, "").length;
      if (digitCount < 6) return;
    }

    setLookupLoading(true);
    setLookupResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-company", {
        body: { company_name: name, org_number },
      });
      if (error) throw error;

      if (data.found) {
        const filled = new Set<string>();
        const conf = data.confidence || {};
        // Post-process: ensure city uppercase and phone has no leading zero
        const city = data.city ? data.city.toUpperCase() : "";
        const phone = data.phone ? data.phone.replace(/^0+/, "") : "";
        setForm((prev) => {
          const next = { ...prev };
          // Only auto-fill fields with high confidence from verified sources
          const shouldFill = (field: string, value: string) => {
            if (!value || prev[field as keyof CompanyFormData]) return false;
            // For verified registry data, always fill. For AI fallback, only fill if high confidence.
            if (data.verified) return true;
            return conf[field] === "high";
          };
          if (shouldFill("country", data.country)) { next.country = data.country; filled.add("country"); }
          if (shouldFill("address", data.address)) { next.address = data.address; filled.add("address"); }
          if (shouldFill("postcode", data.postcode)) { next.postcode = data.postcode; filled.add("postcode"); }
          if (shouldFill("city", city)) { next.city = city; filled.add("city"); }
          if (shouldFill("email", data.email)) { next.email = data.email; filled.add("email"); }
          if (shouldFill("website", data.website)) { next.website = data.website; filled.add("website"); }
          if (shouldFill("phone", phone)) { next.phone = phone; filled.add("phone"); }
          if (data.org_number && !prev.org_number && (data.verified || conf.org_number === "high")) {
            next.org_number = data.org_number; filled.add("org_number");
          }
          return next;
        });
        if (data.dial_code) {
          setDialCode((prev) => prev || data.dial_code);
        }
        setAutoFilled(filled);
        setLookupResult({
          warnings: data.warnings,
          message: data.message,
          confidence: data.confidence,
          sources: data.sources,
          verified: data.verified,
        });
      } else {
        setLookupResult({
          warnings: data.warnings || ["Company not found. Please fill in the details manually."],
          message: data.message || "Could not find company details.",
        });
      }
    } catch (err) {
      console.error("Company lookup error:", err);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  // Debounced auto-lookup when both name and org_number are filled
  const scheduleLookup = useCallback((name: string, org_number: string) => {
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    lookupTimeoutRef.current = setTimeout(() => {
      runCompanyLookup(name, org_number);
    }, 1200);
  }, [runCompanyLookup]);

  // AI address validation - debounced
  const runAiValidation = useCallback((country: string, postcode: string, city: string, address: string, phone: string, currentDialCode: string, org_number: string) => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (!country || (!postcode && !city && !address && !phone && !org_number)) {
      setAiValidation({});
      return;
    }
    aiTimeoutRef.current = setTimeout(async () => {
      setAiLoading(true);
      setAiValidation({});
      try {
        const { data, error } = await supabase.functions.invoke("validate-address", {
          body: { country, postcode, city, address, phone, dialCode: currentDialCode, org_number },
        });
        if (error) throw error;
        const messages: Record<string, string> = {};
        if (data.org_number_valid === false && data.org_number_message) {
          messages.org_number_ai = data.org_number_message;
        }
        if (data.org_number_valid === true && org_number) {
          messages.org_number_ok_ai = data.org_number_message || "AI verified: valid organization number";
        }
        if (data.postcode_valid === false && data.postcode_message) {
          messages.postcode_ai = data.postcode_message;
        }
        if (data.city_valid === false && data.city_message) {
          messages.city_ai = data.city_message;
        }
        if (data.match_valid === false && data.match_message) {
          messages.match_ai = data.match_message;
        }
        if (data.address_valid === false && data.address_message) {
          messages.address_ai = data.address_message;
        }
        if (data.address_valid === true && address) {
          messages.address_ok_ai = "AI verified: address looks correct";
        }
        if (data.phone_valid === false && data.phone_message) {
          messages.phone_ai = data.phone_message;
        }
        if (data.phone_valid === true && phone) {
          messages.phone_ok_ai = "AI verified: phone number looks correct";
        }
        if (data.postcode_valid === true && data.city_valid === true) {
          messages.address_ok = "AI verified: address looks correct";
        }
        setAiValidation(messages);
      } catch (err) {
        console.error("AI validation error:", err);
      } finally {
        setAiLoading(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    if (initialData) {
      let existingDial = "+46";
      let phoneNum = initialData.phone || "";
      const matchedCountry = countries.find((c) => phoneNum.startsWith(c.dialCode));
      if (matchedCountry) {
        existingDial = matchedCountry.dialCode;
        phoneNum = phoneNum.slice(matchedCountry.dialCode.length).trim();
      }
      setDialCode(existingDial);
      setForm({
        name: initialData.name || "",
        org_number: initialData.org_number || "",
        address: initialData.address || "",
        postcode: initialData.postcode || "",
        city: initialData.city || "",
        phone: phoneNum,
        email: initialData.email || "",
        country: initialData.country || "",
        website: initialData.website || "",
      });
    } else {
      setForm(initialForm);
      setDialCode("+46");
    }
    setErrors({});
    setTouched(new Set());
    setAiValidation({});
    setLookupResult(null);
    setAutoFilled(new Set());
  }, [initialData, open]);

  const triggerAi = useCallback((nextForm: CompanyFormData, currentDialCode: string) => {
    if (nextForm.country && (nextForm.postcode || nextForm.city || nextForm.address || nextForm.phone || nextForm.org_number)) {
      runAiValidation(nextForm.country, nextForm.postcode, nextForm.city, nextForm.address, nextForm.phone, currentDialCode, nextForm.org_number);
    }
  }, [runAiValidation]);

  const set = (key: keyof CompanyFormData, value: string) => {
    // Clear auto-filled status when user manually edits
    if (autoFilled.has(key)) {
      setAutoFilled((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Client-side postcode format check
      if (key === "postcode" && next.country && value) {
        const formatResult = validatePostcodeFormat(next.country, value);
        if (formatResult && !formatResult.valid) {
          setErrors((prev) => ({ ...prev, postcode: formatResult.message }));
        } else if (formatResult && formatResult.valid) {
          setErrors((prev) => { const n = { ...prev }; delete n.postcode; return n; });
        }
      }
      // Trigger AI validation for any relevant field change
      if (["postcode", "city", "country", "address", "phone", "org_number"].includes(key)) {
        triggerAi(next, dialCode);
      }
      // Trigger company lookup when name or org_number changes
      if (key === "name" || key === "org_number") {
        const name = key === "name" ? value : next.name;
        const org = key === "org_number" ? value : next.org_number;
        scheduleLookup(name, org);
      }
      return next;
    });
    if (touched.has(key)) {
      validateField(key, value);
    }
  };

  const handleDialCodeChange = (newDialCode: string) => {
    setDialCode(newDialCode);
    // Re-trigger AI validation with new dial code
    if (form.country && form.phone) {
      runAiValidation(form.country, form.postcode, form.city, form.address, form.phone, newDialCode, form.org_number);
    }
  };

  const markTouched = (key: string) => {
    setTouched((prev) => new Set(prev).add(key));
    validateField(key, form[key as keyof CompanyFormData]);
  };

  const validateField = (key: string, value: string) => {
    const fullData = { ...form, [key]: value };
    // Combine phone for validation
    if (key === "phone") {
      fullData.phone = value ? `${dialCode}${value}` : "";
    }
    const result = companySchema.safeParse(fullData);
    if (result.success) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } else {
      const fieldError = result.error.issues.find((i) => i.path[0] === key);
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [key]: fieldError.message }));
      } else {
        setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Combine phone with dial code for submission
    const submitData = {
      ...form,
      phone: form.phone ? `${dialCode} ${form.phone}` : "",
    };

    const result = companySchema.safeParse(submitData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!newErrors[key]) newErrors[key] = issue.message;
      });
      setErrors(newErrors);
      setTouched(new Set(Object.keys(newErrors)));
      return;
    }
    onSubmit(submitData);
  };

  const isFieldValid = (key: string) => {
    const val = form[key as keyof CompanyFormData];
    return touched.has(key) && !errors[key] && !!val;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{initialData ? "Edit Company" : "Add Company"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <form id="company-form" onSubmit={handleSubmit} className="space-y-4 pb-4" noValidate>
            {/* Contract fields */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Employer / Arbetsgivare *
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => markTouched("name")}
                className={cn(errors.name && touched.has("name") && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldMessage error={touched.has("name") ? errors.name : undefined} valid={isFieldValid("name")} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Organization Number / Organisationsnummer
              </Label>
              <Input
                value={form.org_number}
                onChange={(e) => set("org_number", e.target.value)}
                onBlur={() => markTouched("org_number")}
                placeholder="e.g. 556677-8899"
                className={cn(
                  (errors.org_number && touched.has("org_number")) && "border-destructive focus-visible:ring-destructive",
                  aiValidation.org_number_ai && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <FieldMessage
                error={touched.has("org_number") ? (errors.org_number || aiValidation.org_number_ai) : undefined}
                valid={isFieldValid("org_number") && !aiValidation.org_number_ai}
                loading={aiLoading && !!form.org_number && !!form.country}
                info={!errors.org_number && !aiValidation.org_number_ai && aiValidation.org_number_ok_ai ? aiValidation.org_number_ok_ai : undefined}
                autoFilled={autoFilled.has("org_number")} source={lookupResult?.sources?.org_number}
              />
            </div>

            {/* AI Lookup Status Banner */}
            {lookupLoading && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border animate-fade-in">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">
                  Searching business registry...
                </p>
              </div>
            )}
            {lookupResult && !lookupLoading && (
              <div className={cn(
                "p-3 rounded-md border animate-fade-in",
                lookupResult.warnings?.length
                  ? "bg-destructive/5 border-destructive/30"
                  : lookupResult.verified
                    ? "bg-success/5 border-success/30"
                    : "bg-warning/5 border-warning/30"
              )}>
                {/* Verified / Unverified badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  {lookupResult.verified ? (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Registry Data
                    </Badge>
                  ) : lookupResult.verified === false ? (
                    <Badge variant="warning" className="text-[10px] gap-1">
                      <ShieldAlert className="w-3 h-3" /> Unverified — AI Knowledge Base
                    </Badge>
                  ) : null}
                </div>
                {lookupResult.warnings?.length ? (
                  <div className="space-y-1">
                    {lookupResult.warnings.map((w, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w}
                      </p>
                    ))}
                  </div>
                ) : null}
                {autoFilled.size > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    Auto-filled {autoFilled.size} field{autoFilled.size > 1 ? "s" : ""}: {Array.from(autoFilled).join(", ")}
                  </p>
                )}
                {lookupResult.message && !lookupResult.warnings?.length && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    {lookupResult.message}
                  </p>
                )}
              </div>
            )}

            {/* Country first - enables smart validation for postcode/city */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Country / Land
              </Label>
              <CountryCombobox value={form.country} onChange={(v) => { set("country", v); markTouched("country"); }} />
              <FieldMessage valid={isFieldValid("country")} autoFilled={autoFilled.has("country")} source={lookupResult?.sources?.country} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Address / Adress
              </Label>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                onBlur={() => markTouched("address")}
                className={cn(
                  (errors.address && touched.has("address")) && "border-destructive focus-visible:ring-destructive",
                  aiValidation.address_ai && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <FieldMessage
                error={touched.has("address") ? (errors.address || aiValidation.address_ai) : undefined}
                valid={isFieldValid("address") && !aiValidation.address_ai}
                loading={aiLoading && !!form.address}
                info={!errors.address && !aiValidation.address_ai && aiValidation.address_ok_ai && form.address ? aiValidation.address_ok_ai : undefined}
                autoFilled={autoFilled.has("address")} source={lookupResult?.sources?.address}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Postcode / Postnummer
                  {form.country && postcodePatterns[form.country] && (
                    <span className="ml-1.5 font-normal normal-case text-muted-foreground">
                      ({postcodePatterns[form.country].label})
                    </span>
                  )}
                </Label>
                <Input
                  value={form.postcode}
                  onChange={(e) => set("postcode", e.target.value)}
                  onBlur={() => markTouched("postcode")}
                  placeholder={form.country && postcodePatterns[form.country] ? `e.g. ${postcodePatterns[form.country].example}` : ""}
                  className={cn(
                    (errors.postcode && touched.has("postcode")) && "border-destructive focus-visible:ring-destructive",
                    aiValidation.postcode_ai && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <FieldMessage
                  error={touched.has("postcode") ? (errors.postcode || aiValidation.postcode_ai) : undefined}
                  valid={isFieldValid("postcode") && !aiValidation.postcode_ai}
                  loading={aiLoading && !!form.postcode}
                  info={!errors.postcode && !aiValidation.postcode_ai && aiValidation.address_ok && form.postcode ? aiValidation.address_ok : undefined}
                  autoFilled={autoFilled.has("postcode")} source={lookupResult?.sources?.postcode}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  City / Ort
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  onBlur={() => markTouched("city")}
                  className={cn(
                    (errors.city && touched.has("city")) && "border-destructive focus-visible:ring-destructive",
                    aiValidation.city_ai && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <FieldMessage
                  error={touched.has("city") ? (errors.city || aiValidation.city_ai) : undefined}
                  valid={isFieldValid("city") && !aiValidation.city_ai}
                  loading={aiLoading && !!form.city}
                  info={aiValidation.match_ai || undefined}
                  autoFilled={autoFilled.has("city")} source={lookupResult?.sources?.city}
                />
              </div>
            </div>

            {/* Register-only fields */}
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Additional Information (Register Only)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Mobile Phone Number / Mobilnummer
              </Label>
              <PhonePrefixInput
                value={form.phone}
                onChange={(v) => set("phone", v)}
                dialCode={dialCode}
                onDialCodeChange={handleDialCodeChange}
              />
              {/* Validate on blur of the phone input area */}
              <div onBlur={() => markTouched("phone")}>
                <FieldMessage
                  error={touched.has("phone") ? (errors.phone || aiValidation.phone_ai) : undefined}
                  valid={isFieldValid("phone") && !aiValidation.phone_ai}
                  loading={aiLoading && !!form.phone}
                  info={!errors.phone && !aiValidation.phone_ai && aiValidation.phone_ok_ai && form.phone ? aiValidation.phone_ok_ai : undefined}
                  autoFilled={autoFilled.has("phone")} source={lookupResult?.sources?.phone}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Email / E-post
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => markTouched("email")}
                placeholder="company@example.com"
                className={cn(errors.email && touched.has("email") && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldMessage error={touched.has("email") ? errors.email : undefined} valid={isFieldValid("email")} autoFilled={autoFilled.has("email")} source={lookupResult?.sources?.email} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Website / Webbplats
              </Label>
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                onBlur={() => markTouched("website")}
                placeholder="www.example.com"
                className={cn(errors.website && touched.has("website") && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldMessage error={touched.has("website") ? errors.website : undefined} valid={isFieldValid("website")} autoFilled={autoFilled.has("website")} source={lookupResult?.sources?.website} />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="px-6 pb-6 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="company-form">
            {initialData ? "Save Changes" : "Add Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
