import { useState, useEffect } from "react";
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
  name: "",
  org_number: "",
  address: "",
  postcode: "",
  city: "",
  phone: "",
  email: "",
  country: "",
  website: "",
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CompanyFormDialogProps) {
  const [form, setForm] = useState<CompanyFormData>(initialForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        org_number: initialData.org_number || "",
        address: initialData.address || "",
        postcode: initialData.postcode || "",
        city: initialData.city || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        country: initialData.country || "",
        website: initialData.website || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const set = (key: keyof CompanyFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{initialData ? "Edit Company" : "Add Company"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <form id="company-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
            {/* Contract fields - used in employment contracts */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Employer / Arbetsgivare *
              </Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Organization Number / Organisationsnummer
              </Label>
              <Input value={form.org_number} onChange={(e) => set("org_number", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Address / Adress
              </Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Postcode / Postnummer
                </Label>
                <Input value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  City / Ort
                </Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
            </div>

            {/* Register-only fields - NOT used in employment contracts */}
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Additional Information (Register Only)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Country / Land
                </Label>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Mobile Phone Number / Mobilnummer
                </Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Email / E-post
              </Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Website / Webbplats
              </Label>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="www.example.com" />
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
