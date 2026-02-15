import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Check, ChevronsUpDown, AlertCircle, CheckCircle2 } from "lucide-react";

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

function FieldMessage({ error, valid }: { error?: string; valid?: boolean }) {
  if (error) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-destructive mt-1 animate-fade-in">
        <AlertCircle className="w-3 h-3 shrink-0" /> {error}
      </p>
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
  const [dialCode, setDialCode] = useState("+46"); // Default Sweden
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialData) {
      // Extract dial code from existing phone if present
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
  }, [initialData, open]);

  const set = (key: keyof CompanyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Validate single field on change if already touched
    if (touched.has(key)) {
      validateField(key, value);
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
                className={cn(errors.org_number && touched.has("org_number") && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldMessage error={touched.has("org_number") ? errors.org_number : undefined} valid={isFieldValid("org_number")} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Address / Adress
              </Label>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                onBlur={() => markTouched("address")}
                className={cn(errors.address && touched.has("address") && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldMessage error={touched.has("address") ? errors.address : undefined} valid={isFieldValid("address")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Postcode / Postnummer
                </Label>
                <Input
                  value={form.postcode}
                  onChange={(e) => set("postcode", e.target.value)}
                  onBlur={() => markTouched("postcode")}
                  className={cn(errors.postcode && touched.has("postcode") && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldMessage error={touched.has("postcode") ? errors.postcode : undefined} valid={isFieldValid("postcode")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  City / Ort
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  onBlur={() => markTouched("city")}
                  className={cn(errors.city && touched.has("city") && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldMessage error={touched.has("city") ? errors.city : undefined} valid={isFieldValid("city")} />
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
                Country / Land
              </Label>
              <CountryCombobox value={form.country} onChange={(v) => { set("country", v); markTouched("country"); }} />
              <FieldMessage valid={isFieldValid("country")} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Mobile Phone Number / Mobilnummer
              </Label>
              <PhonePrefixInput
                value={form.phone}
                onChange={(v) => set("phone", v)}
                dialCode={dialCode}
                onDialCodeChange={setDialCode}
              />
              {/* Validate on blur of the phone input area */}
              <div onBlur={() => markTouched("phone")}>
                <FieldMessage error={touched.has("phone") ? errors.phone : undefined} valid={isFieldValid("phone")} />
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
              <FieldMessage error={touched.has("email") ? errors.email : undefined} valid={isFieldValid("email")} />
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
              <FieldMessage error={touched.has("website") ? errors.website : undefined} valid={isFieldValid("website")} />
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
