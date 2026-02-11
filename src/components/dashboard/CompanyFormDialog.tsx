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

interface Company {
  id?: string;
  name: string;
  org_number: string;
  address: string;
  postcode: string;
  city: string;
}

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (company: Omit<Company, "id">) => void;
  initialData?: Company | null;
}

const fields = [
  { key: "name", en: "Employer", sv: "Arbetsgivare", required: true },
  { key: "org_number", en: "Organization Number", sv: "Organisationsnummer" },
  { key: "address", en: "Address", sv: "Adress" },
  { key: "postcode", en: "Postcode", sv: "Postnummer" },
  { key: "city", en: "City", sv: "Ort" },
] as const;

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CompanyFormDialogProps) {
  const [form, setForm] = useState<Omit<Company, "id">>({
    name: "",
    org_number: "",
    address: "",
    postcode: "",
    city: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        org_number: initialData.org_number || "",
        address: initialData.address || "",
        postcode: initialData.postcode || "",
        city: initialData.city || "",
      });
    } else {
      setForm({ name: "", org_number: "", address: "", postcode: "", city: "" });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Company" : "Add Company"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-sm">
                {field.en}{" "}
                <span className="text-muted-foreground font-normal">
                  / {field.sv}
                </span>
              </Label>
              <Input
                id={field.key}
                value={form[field.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                required={"required" in field && field.required}
                placeholder={field.en}
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Save Changes" : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
