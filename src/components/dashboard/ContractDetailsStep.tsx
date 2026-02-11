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
  middle_name: string | null;
  email: string;
  phone: string | null;
  employee_code: string | null;
  city: string | null;
  country: string | null;
  personal_info: Record<string, any> | null;
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
  const [section5Open, setSection5Open] = useState(true);
  const [section6Open, setSection6Open] = useState(true);

  const pi = employee.personal_info ?? {};

  // Employee form state
  const [firstName, setFirstName] = useState(employee.first_name ?? "");
  const [middleName, setMiddleName] = useState(employee.middle_name ?? "");
  const [lastName, setLastName] = useState(employee.last_name ?? "");
  const [preferredName, setPreferredName] = useState(pi.preferred_name ?? "");
  const [address, setAddress] = useState(pi.address1 ?? "");
  const [address2, setAddress2] = useState(pi.address2 ?? "");
  const [zipCode, setZipCode] = useState(pi.zip_code ?? "");
  const [city, setCity] = useState(employee.city ?? "");
  const [stateProvince, setStateProvince] = useState(pi.state_province ?? "");
  const [country, setCountry] = useState(employee.country ?? "");
  const [birthday, setBirthday] = useState<Date | undefined>(
    pi.birthday ? new Date(pi.birthday) : undefined
  );
  const [countryOfBirth, setCountryOfBirth] = useState(pi.country_of_birth ?? "");
  const [citizenship, setCitizenship] = useState(pi.citizenship ?? "");
  const [mobile, setMobile] = useState(employee.phone ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [emergencyFirstName, setEmergencyFirstName] = useState(pi.emergency_first_name ?? "");
  const [emergencyLastName, setEmergencyLastName] = useState(pi.emergency_last_name ?? "");
  const [emergencyMobile, setEmergencyMobile] = useState(pi.emergency_mobile ?? "");

  // Section 3 state
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [stationing, setStationing] = useState("");

  // Section 5 state
  const [employmentForm, setEmploymentForm] = useState<"permanent" | "probationary">("permanent");
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
  const [probationStartDate, setProbationStartDate] = useState<Date | undefined>(undefined);

  // Section 6 state
  const [workingTime, setWorkingTime] = useState<"fulltime" | "parttime">("fulltime");
  const [partTimePercent, setPartTimePercent] = useState("");

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

        {/* Section 2.1: Name and Address Information */}
        <Collapsible open={section21Open} onOpenChange={setSection21Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="2.1"
              titleEn="Name and Address Information"
              titleSv="Namn och Adressinformation"
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
                  {renderLabel("Middle Name", "Mellannamn", false)}
                  {renderField(middleName, setMiddleName)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Last Name", "Efternamn")}
                  {renderField(lastName, setLastName)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Preferred Name", "Tilltalsnamn")}
                  {renderField(preferredName, setPreferredName)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("Address 1", "Adress 1")}
                  {renderField(address, setAddress)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("Address 2", "Adress 2", false)}
                  {renderField(address2, setAddress2)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("ZIP / Postal Code", "Postnummer")}
                  {renderField(zipCode, setZipCode)}
                </div>
                <div className="space-y-1.5">
                  {renderLabel("City", "Ort")}
                  {renderField(city, setCity)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {renderLabel("State / Province", "Län / Region")}
                  {renderField(stateProvince, setStateProvince)}
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
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2.2: Birth and Contact Information */}
        <Collapsible open={section22Open} onOpenChange={setSection22Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="2.2"
              titleEn="Birth and Contact Information"
              titleSv="Födelse- och Kontaktinformation"
              open={section22Open}
              onToggle={() => setSection22Open(!section22Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
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
                {renderLabel("Country of Birth?", "Födelseland?")}
                <Select value={countryOfBirth} onValueChange={setCountryOfBirth} required>
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
              <div className="space-y-1.5">
                {renderLabel("Citizenship?", "Medborgarskap?")}
                <Select value={citizenship} onValueChange={setCitizenship} required>
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
              <div className="space-y-1.5">
                {renderLabel("Mobile Phone Number", "Mobilnummer")}
                {renderField(mobile, setMobile)}
              </div>
              <div className="space-y-1.5">
                {renderLabel("Email", "E-post")}
                {renderField(email, setEmail, "email")}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2.3: Emergency Contact Information */}
        <Collapsible open={section23Open} onOpenChange={setSection23Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="2.3"
              titleEn="Emergency Contact Information"
              titleSv="Information om Närmast Anhörig"
              open={section23Open}
              onToggle={() => setSection23Open(!section23Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              <div className="space-y-1.5">
                {renderLabel("Emergency Contact First Name", "Närmast Anhörig Förnamn")}
                {renderField(emergencyFirstName, setEmergencyFirstName)}
              </div>
              <div className="space-y-1.5">
                {renderLabel("Emergency Contact Last Name", "Närmast Anhörig Efternamn")}
                {renderField(emergencyLastName, setEmergencyLastName)}
              </div>
              <div className="space-y-1.5">
                {renderLabel("Emergency Contact Mobile Phone Number", "Närmast Anhörig Mobilnummer")}
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

        {/* Section 5: Form of Employment */}
        <Collapsible open={section5Open} onOpenChange={setSection5Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="5"
              titleEn="Form of Employment"
              titleSv="Anställningsform"
              open={section5Open}
              onToggle={() => setSection5Open(!section5Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-3">
              {/* Permanent Employment */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "permanent"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("permanent")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    employmentForm === "permanent" ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {employmentForm === "permanent" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    Permanent Employment from / Tillsvidareanställning från
                  </span>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 text-sm font-medium",
                        !employmentStartDate && "text-muted-foreground"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {employmentStartDate ? format(employmentStartDate, "yyyy-MM-dd") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={employmentStartDate}
                      onSelect={setEmploymentStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Probationary Period */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "probationary"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("probationary")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    employmentForm === "probationary" ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {employmentForm === "probationary" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    employmentForm !== "probationary" && "text-muted-foreground"
                  )}>
                    Probationary Period from / Provanställning från
                  </span>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 text-sm font-medium",
                        !probationStartDate && "text-muted-foreground"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {probationStartDate ? format(probationStartDate, "yyyy-MM-dd") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={probationStartDate}
                      onSelect={setProbationStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 6: Working Time & Organisation */}
        <Collapsible open={section6Open} onOpenChange={setSection6Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="6"
              titleEn="Working Time & Organisation"
              titleSv="Arbetstid och arbetstidens förläggning"
              open={section6Open}
              onToggle={() => setSection6Open(!section6Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-3">
              {/* Full time */}
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                  workingTime === "fulltime"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
                onClick={() => setWorkingTime("fulltime")}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  workingTime === "fulltime" ? "border-primary" : "border-muted-foreground/40"
                )}>
                  {workingTime === "fulltime" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm font-semibold">
                  Full time 38/40 hours per week (excl. public holidays) / Heltid 38/40 timmar per vecka (exkl. helgdagar)
                </span>
              </div>

              {/* Part time */}
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                  workingTime === "parttime"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
                onClick={() => setWorkingTime("parttime")}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  workingTime === "parttime" ? "border-primary" : "border-muted-foreground/40"
                )}>
                  {workingTime === "parttime" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-sm font-semibold",
                    workingTime !== "parttime" && "text-muted-foreground"
                  )}>
                    Part time / Deltid
                  </span>
                  {workingTime === "parttime" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={partTimePercent}
                        onChange={(e) => setPartTimePercent(e.target.value)}
                        className="w-20 h-9 text-sm"
                        placeholder="%"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        per cent of full time / procent av heltid
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      per cent of full time / procent av heltid
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

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
