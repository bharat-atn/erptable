import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Building2, ChevronDown, ArrowLeft, ArrowRight, User, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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

const JOB_TYPES = [
  {
    group: "Type 1: General Forestry Work",
    items: [
      "Planting / Plantering",
      "Brush clearing / Motormanuell röjning",
      "Chainsaw felling / Motormanuell huggning",
    ],
  },
  {
    group: "Type 2: Nursery Work",
    items: [
      "Nursery worker type 1 / Plantskolearbetare typ 1",
      "Nursery worker type 2 / Plantskolearbetare typ 2",
      "Nursery worker type 3 / Plantskolearbetare typ 3",
    ],
  },
  {
    group: "Type 3: Machine Work",
    items: [
      "Forwarder operator / Skotarförare",
      "Harvester operator / Skördarförare",
      "Combined operator / Både skotar- + skördarförare",
    ],
  },
  {
    group: "Type 4: Machine Repair Work",
    items: [
      "Machine repair LG2 / Maskinreparation LG2",
      "Machine repair LG3 / Maskinreparation LG3",
    ],
  },
  {
    group: "Type 5: Special Forestry Work",
    items: [
      "Data collection / Enklare datainsamling",
      "Qualified tasks / Kvalificerade uppgifter",
      "Conservation planning / Naturvårdsplanläggning",
      "Team leader / Lagbas",
    ],
  },
];

const EXPERIENCE_LEVELS = [
  "Entry Level (0 years / < 1 season)",
  "Junior (1 year / 1 season)",
  "Experienced (2 years / seasons)",
  "Senior (3 years / seasons)",
  "Expert (4+ years / seasons)",
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
  const [section3Open, setSection3Open] = useState(true);
  const [section4Open, setSection4Open] = useState(true);

  // Employee form state
  const [firstName, setFirstName] = useState(employee.first_name ?? "");
  const [lastName, setLastName] = useState(employee.last_name ?? "");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [personalId, setPersonalId] = useState("");
  const [mobile, setMobile] = useState(employee.phone ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [emergencyFirstName, setEmergencyFirstName] = useState("");
  const [emergencyLastName, setEmergencyLastName] = useState("");
  const [emergencyMobile, setEmergencyMobile] = useState("");

  // Section 3 state
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [stationing, setStationing] = useState("");

  const renderLabel = (en: string, sv: string, required = true) => (
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
      required
    />
  );

  const SectionHeader = ({
    number,
    titleEn,
    titleSv,
    open,
    onToggle,
  }: {
    number: string;
    titleEn: string;
    titleSv: string;
    open: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between rounded-full border px-6 py-3 text-sm font-semibold transition-colors",
        "border-primary bg-primary/5 text-primary"
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

  // Birthday date range: 16-80 years old
  const today = new Date();
  const minBirthDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());
  const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

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
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("First Name", "Förnamn")}
                  {renderField(firstName, setFirstName)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Last Name", "Efternamn")}
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
                  {renderLabel("City", "Ort")}
                  {renderField(city, setCity)}
                </div>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Country", "Land")}
                <Select value={country} onValueChange={setCountry} required>
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
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Birthday", "Födelsedag")}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left text-sm font-medium",
                          !birthday && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthday ? format(birthday, "yyyy-MM-dd") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthday}
                        onSelect={setBirthday}
                        disabled={(date) =>
                          date > maxBirthDate || date < minBirthDate
                        }
                        defaultMonth={maxBirthDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Personal ID / Social Security", "Personnummer")}
                  {renderField(personalId, setPersonalId)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Mobile Number", "Mobilnummer")}
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

        {/* Section 3: Employment Details */}
        <Collapsible open={section3Open} onOpenChange={setSection3Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="3"
              titleEn="Employment Details"
              titleSv="Anställningsuppgifter"
              open={section3Open}
              onToggle={() => setSection3Open(!section3Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="space-y-1.5">
                {renderLabel("Job Type / Arbetsuppgift / Befattningstyp", "Arbetsuppgift")}
                <Select value={jobType} onValueChange={setJobType} required>
                  <SelectTrigger className="h-11 text-sm font-medium">
                    <SelectValue placeholder="Pick the job type... / Välj arbetsuppgift..." />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((group) => (
                      <SelectGroup key={group.group}>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.group}
                        </SelectLabel>
                        {group.items.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Experience Level / Erfarenhet / Lönegrupp", "Erfarenhet")}
                <Select value={experienceLevel} onValueChange={setExperienceLevel} required>
                  <SelectTrigger className="h-11 text-sm font-medium">
                    <SelectValue placeholder="Choose the experience level... / Välj erfarenhetsnivå..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                {renderLabel("Stationing", "Stationeringsort")}
                {renderField(stationing, setStationing)}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 4: Collective Agreement */}
        <Collapsible open={section4Open} onOpenChange={setSection4Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="4"
              titleEn="Collective Agreement"
              titleSv="Kollektivavtal"
              open={section4Open}
              onToggle={() => setSection4Open(!section4Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2">
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                    Skogsavtalet / GS-Facket
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Covered by Skogsavtalet between GS and Gröna arbetsgivare. / Anställningen omfattas av Skogsavtalet mellan GS och Gröna arbetsgivare.
                  </p>
                </div>
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
