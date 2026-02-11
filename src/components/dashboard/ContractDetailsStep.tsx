import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Building2, ChevronDown, ArrowLeft, ArrowRight, User } from "lucide-react";

interface Company {
  id: string;
  name: string;
  org_number: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  employee_code: string | null;
}

interface ContractDetailsStepProps {
  company: Company;
  employee: Employee;
  onBack: () => void;
}

const COUNTRIES = [
  "Sweden", "Romania", "Poland", "Ukraine", "Lithuania", "Latvia",
  "Estonia", "Germany", "Spain", "France", "Thailand",
];

export function ContractDetailsStep({
  company,
  employee,
  onBack,
}: ContractDetailsStepProps) {
  const [section1Open, setSection1Open] = useState(false);
  const [section21Open, setSection21Open] = useState(true);
  const [section22Open, setSection22Open] = useState(true);
  const [section23Open, setSection23Open] = useState(true);

  // Employee form state pre-filled from register
  const [firstName, setFirstName] = useState(employee.first_name ?? "");
  const [lastName, setLastName] = useState(employee.last_name ?? "");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [birthday, setBirthday] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [mobile, setMobile] = useState(employee.phone ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [emergencyFirstName, setEmergencyFirstName] = useState("");
  const [emergencyLastName, setEmergencyLastName] = useState("");
  const [emergencyMobile, setEmergencyMobile] = useState("");

  const renderLabel = (en: string, sv: string, required?: boolean) => (
    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
      {en} / {sv}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );

  const renderField = (value: string, onChange: (v: string) => void, type = "text") => (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 text-sm font-medium"
    />
  );

  const SectionHeader = ({
    number,
    titleEn,
    titleSv,
    open,
    onToggle,
    variant = "green",
  }: {
    number: string;
    titleEn: string;
    titleSv: string;
    open: boolean;
    onToggle: () => void;
    variant?: "green" | "default";
  }) => (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between rounded-full border-2 px-6 py-3 text-sm font-semibold transition-colors",
        variant === "green"
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-muted/30 text-foreground"
      )}
    >
      <span>
        Section {number}: {titleEn} / Sektion {number}: {titleSv}
      </span>
      <ChevronDown
        className={cn(
          "w-4 h-4 transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </button>
  );

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Contract Details{" "}
          <span className="text-muted-foreground font-normal text-sm">
            / Avtalsuppgifter
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Section 1: Employer Information */}
        <Collapsible open={section1Open} onOpenChange={setSection1Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="1"
              titleEn="Employer Information"
              titleSv="Arbetsgivarinformation"
              open={section1Open}
              onToggle={() => setSection1Open(!section1Open)}
              variant="default"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Employer", "Arbetsgivare")}
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                    {company.name}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Organization Number", "Organisationsnummer")}
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                    {company.org_number || "—"}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Address", "Adress")}
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                  {company.address || "—"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Postcode", "Postnummer")}
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                    {company.postcode || "—"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {renderLabel("City", "Ort")}
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                    {company.city || "—"}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2.1: Name and Address */}
        <Collapsible open={section21Open} onOpenChange={setSection21Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="2.1"
              titleEn="Name and Address"
              titleSv="Namn och Adress"
              open={section21Open}
              onToggle={() => setSection21Open(!section21Open)}
              variant="green"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("First Name", "Förnamn", true)}
                  {renderField(firstName, setFirstName)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Last Name", "Efternamn", true)}
                  {renderField(lastName, setLastName)}
                </div>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Address Line 1", "Adressrad 1")}
                {renderField(address, setAddress)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Zip Code", "Postnummer")}
                  {renderField(zipCode, setZipCode)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("City", "Ort", true)}
                  {renderField(city, setCity)}
                </div>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Country", "Land")}
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 text-sm font-medium">
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2.2: Birth and Contact */}
        <Collapsible open={section22Open} onOpenChange={setSection22Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="2.2"
              titleEn="Birth and Contact"
              titleSv="Födelse och Kontakt"
              open={section22Open}
              onToggle={() => setSection22Open(!section22Open)}
              variant="green"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Birthday", "Födelsedag", true)}
                  {renderField(birthday, setBirthday, "date")}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Personal ID / Social Security", "Personnummer", true)}
                  {renderField(personalId, setPersonalId)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Mobile Number", "Mobilnummer", true)}
                  {renderField(mobile, setMobile)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Email Address", "E-post")}
                  {renderField(email, setEmail, "email")}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2.3: Emergency Contact */}
        <Collapsible open={section23Open} onOpenChange={setSection23Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="2.3"
              titleEn="Emergency Contact"
              titleSv="Närmast Anhörig"
              open={section23Open}
              onToggle={() => setSection23Open(!section23Open)}
              variant="green"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Emergency Contact First Name", "Närmast Anhörig Förnamn")}
                  {renderField(emergencyFirstName, setEmergencyFirstName)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Emergency Contact Last Name", "Närmast Anhörig Efternamn")}
                  {renderField(emergencyLastName, setEmergencyLastName)}
                </div>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Emergency Contact Mobile", "Närmast Anhörig Mobil")}
                {renderField(emergencyMobile, setEmergencyMobile)}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8">
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
