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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableCountrySelect } from "@/components/ui/searchable-country-select";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => void;
  isLoading?: boolean;
}

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";
  personal_info: Json;
}

interface PersonalInfo {
  preferred_name: string;
  address_1: string;
  address_2: string;
  zip: string;
  state: string;
  birthday: string;
  country_of_birth: string;
  citizenship: string;
  emergency_first_name: string;
  emergency_last_name: string;
  emergency_phone: string;
}

const initialPersonalInfo: PersonalInfo = {
  preferred_name: "",
  address_1: "",
  address_2: "",
  zip: "",
  state: "",
  birthday: "",
  country_of_birth: "",
  citizenship: "",
  emergency_first_name: "",
  emergency_last_name: "",
  emergency_phone: "",
};

const initialForm: Omit<EmployeeFormData, "personal_info"> = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  status: "INVITED",
};

function SectionHeader({ title, open }: { title: string; open: boolean }) {
  return (
    <CollapsibleTrigger className="flex items-center justify-between w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      <span>{title}</span>
      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </CollapsibleTrigger>
  );
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
  isLoading,
}: EmployeeFormDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [info, setInfo] = useState<PersonalInfo>(initialPersonalInfo);
  const [section1Open, setSection1Open] = useState(true);
  const [section2Open, setSection2Open] = useState(true);
  const [section3Open, setSection3Open] = useState(true);

  useEffect(() => {
    if (employee) {
      const pi = (employee.personal_info as Record<string, any>) || {};
      const ec = pi.emergencyContact || {};
      setForm({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        middle_name: employee.middle_name || "",
        email: employee.email,
        phone: employee.phone || pi.mobilePhone || "",
        city: employee.city || pi.city || "",
        country: employee.country || pi.country || "",
        status: employee.status,
      });
      setInfo({
        preferred_name: pi.preferred_name || pi.preferredName || "",
        address_1: pi.address_1 || pi.address1 || "",
        address_2: pi.address_2 || pi.address2 || "",
        zip: pi.zip || pi.zipCode || "",
        state: pi.state || pi.stateProvince || "",
        birthday: pi.birthday || "",
        country_of_birth: pi.country_of_birth || pi.countryOfBirth || "",
        citizenship: pi.citizenship || "",
        emergency_first_name: pi.emergency_first_name || ec.firstName || "",
        emergency_last_name: pi.emergency_last_name || ec.lastName || "",
        emergency_phone: pi.emergency_phone || ec.phone || "",
      });
    } else {
      setForm(initialForm);
      setInfo(initialPersonalInfo);
    }
  }, [employee, open]);

  const isEdit = !!employee;

  const handleSubmit = () => {
    onSubmit({
      ...form,
      personal_info: info as unknown as Json,
    });
  };

  const updateInfo = (field: keyof PersonalInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {/* Section 2.1: Name and Address */}
            <Collapsible open={section1Open} onOpenChange={setSection1Open}>
              <SectionHeader
                title="Section 2.1: Name and Address Information / Sektion 2.1: Namn och Adressinformation"
                open={section1Open}
              />
              <CollapsibleContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">First Name / Förnamn *</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Middle Name / Mellannamn</Label>
                    <Input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Last Name / Efternamn *</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Preferred Name / Tilltalsnamn *</Label>
                    <Input value={info.preferred_name} onChange={(e) => updateInfo("preferred_name", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Address 1 / Adress 1 *</Label>
                    <Input value={info.address_1} onChange={(e) => updateInfo("address_1", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Address 2 / Adress 2</Label>
                    <Input value={info.address_2} onChange={(e) => updateInfo("address_2", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Zip / Postal Code / Postnummer *</Label>
                    <Input value={info.zip} onChange={(e) => updateInfo("zip", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">City / Ort *</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">State / Province / Län / Region *</Label>
                    <Input value={info.state} onChange={(e) => updateInfo("state", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Country / Land *</Label>
                    <SearchableCountrySelect value={form.country} onValueChange={(v) => setForm({ ...form, country: v })} placeholder="Select country" />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Section 2.2: Birth and Contact */}
            <Collapsible open={section2Open} onOpenChange={setSection2Open}>
              <SectionHeader
                title="Section 2.2: Birth and Contact Information / Sektion 2.2: Födelse- och Kontaktinformation"
                open={section2Open}
              />
              <CollapsibleContent className="pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Birthday / Födelsedag *</Label>
                  <Input type="date" value={info.birthday} onChange={(e) => updateInfo("birthday", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Country of Birth? / Födelseland? *</Label>
                    <SearchableCountrySelect value={info.country_of_birth} onValueChange={(v) => updateInfo("country_of_birth", v)} placeholder="Select country" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide">Citizenship? / Medborgarskap? *</Label>
                    <SearchableCountrySelect value={info.citizenship} onValueChange={(v) => updateInfo("citizenship", v)} placeholder="Select country" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Mobile Phone Number / Mobilnummer *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Email / E-post *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Section 2.3: Emergency Contact */}
            <Collapsible open={section3Open} onOpenChange={setSection3Open}>
              <SectionHeader
                title="Section 2.3: Emergency Contact Information / Sektion 2.3: Information om Närmast Anhörig"
                open={section3Open}
              />
              <CollapsibleContent className="pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Emergency Contact First Name / Närmast Anhörig Förnamn *</Label>
                  <Input value={info.emergency_first_name} onChange={(e) => updateInfo("emergency_first_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Emergency Contact Last Name / Närmast Anhörig Efternamn *</Label>
                  <Input value={info.emergency_last_name} onChange={(e) => updateInfo("emergency_last_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Emergency Contact Mobile Phone Number / Närmast Anhörig Mobilnummer *</Label>
                  <Input value={info.emergency_phone} onChange={(e) => updateInfo("emergency_phone", e.target.value)} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EmployeeFormData["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVITED">Invited</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.email || !form.first_name || isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
