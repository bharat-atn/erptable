import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Building2, ChevronDown, ArrowLeft, ArrowRight, User, ShieldCheck, Users, Briefcase, DollarSign, MoreHorizontal, CheckCircle, Check, AlertTriangle, Cloud, CloudOff, Loader2, Lightbulb } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  contractId: string;
  activeSection: "employee" | "section-3" | "section-4" | "section-5" | "section-6" | "section-7" | "section-8" | "section-9" | "section-10" | "section-11";
  onBack: () => void;
  onNext: () => void;
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
  "Entry Level / Nybörjare (0 years / < 1 season / 0 år / < 1 säsong)",
  "Junior / Junior (1 year / 1 season / 1 år / 1 säsong)",
  "Experienced / Erfaren (2 years / seasons / 2 år / säsonger)",
  "Senior / Senior (3 years / seasons / 3 år / säsonger)",
  "Expert / Expert (4+ years / seasons / 4+ år / säsonger)",
];

export function ContractDetailsStep({
  company,
  employee,
  contractId,
  activeSection,
  onBack,
  onNext,
}: ContractDetailsStepProps) {
  const [section1Open, setSection1Open] = useState(false);
  const [section21Open, setSection21Open] = useState(true);
  const [section22Open, setSection22Open] = useState(true);
  const [section23Open, setSection23Open] = useState(true);
  const [section3Open, setSection3Open] = useState(true);
  const [section4Open, setSection4Open] = useState(true);
  const [section5Open, setSection5Open] = useState(true);
  const [section6Open, setSection6Open] = useState(true);
  const [section7Open, setSection7Open] = useState(true);

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
  const [mainDuties, setMainDuties] = useState("Forest Worker / Skogsarbetare");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [postingLocation, setPostingLocation] = useState(company.city ?? "");
  const [workplaceVaries, setWorkplaceVaries] = useState<"yes" | "no" | "">("yes"); 
  const [mainWorkplace, setMainWorkplace] = useState("");
  const [stationing, setStationing] = useState<"main" | "alternative" | "exception">("exception");

  // Section 5 state
  const [employmentForm, setEmploymentForm] = useState<string>("seasonal");
  const [permanentFromDate, setPermanentFromDate] = useState<Date | undefined>(undefined);
  const [probationFromDate, setProbationFromDate] = useState<Date | undefined>(undefined);
  const [probationUntilDate, setProbationUntilDate] = useState<Date | undefined>(undefined);
  const [fixedTermFromDate, setFixedTermFromDate] = useState<Date | undefined>(undefined);
  const [fixedTermUntilDate, setFixedTermUntilDate] = useState<Date | undefined>(undefined);
  const [tempReplacementFromDate, setTempReplacementFromDate] = useState<Date | undefined>(undefined);
  const [tempReplacementPosition, setTempReplacementPosition] = useState("");
  const [tempReplacementNoLaterThan, setTempReplacementNoLaterThan] = useState<Date | undefined>(undefined);
  const [seasonalFromDate, setSeasonalFromDate] = useState<Date | undefined>(undefined);
  const [seasonalEndAround, setSeasonalEndAround] = useState<Date | undefined>(undefined);
  const [age69FromDate, setAge69FromDate] = useState<Date | undefined>(undefined);
  const [age69UntilDate, setAge69UntilDate] = useState<Date | undefined>(undefined);

   // Section 6 state
  const [workingTime, setWorkingTime] = useState<"fulltime" | "parttime">("fulltime");
  const [partTimePercent, setPartTimePercent] = useState("");

  // Section 7 state
  const [annualLeaveDays, setAnnualLeaveDays] = useState("25");

  // Section 8: Salary state
  const [salaryType, setSalaryType] = useState<"hourly" | "monthly">("hourly");
  const [hourlyBasic, setHourlyBasic] = useState("");
  const [hourlyPremium, setHourlyPremium] = useState("");
  const [monthlyBasic, setMonthlyBasic] = useState("");
  const [monthlyPremium, setMonthlyPremium] = useState("");
  const [pieceWorkPay, setPieceWorkPay] = useState(false);
  const [otherSalaryBenefits, setOtherSalaryBenefits] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"account" | "cash">("account");
  const [rateApplied, setRateApplied] = useState(false);
  const [section8Open, setSection8Open] = useState(true);

  // Section 9: Training
  const [section9Open, setSection9Open] = useState(true);
  const [trainingSkotselskolan, setTrainingSkotselskolan] = useState(true);
  const [trainingSYN, setTrainingSYN] = useState(true);
  const [trainingOtherEnabled, setTrainingOtherEnabled] = useState(false);
  const [trainingOtherText, setTrainingOtherText] = useState("");

  // Section 10: Social Security (read-only)
  const [section10Open, setSection10Open] = useState(true);

  // Section 11: Miscellaneous
  const [section11Open, setSection11Open] = useState(true);
  const [miscellaneousText, setMiscellaneousText] = useState("");

  // Load saved form_data from the contract on mount
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (initialLoaded || !contractId) return;
    const load = async () => {
      const { data } = await supabase
        .from("contracts")
        .select("form_data")
        .eq("id", contractId)
        .single();
      if (!data?.form_data) { setInitialLoaded(true); return; }
      const fd = data.form_data as Record<string, any>;
      if (fd.firstName) setFirstName(fd.firstName);
      if (fd.middleName) setMiddleName(fd.middleName);
      if (fd.lastName) setLastName(fd.lastName);
      if (fd.preferredName) setPreferredName(fd.preferredName);
      if (fd.address) setAddress(fd.address);
      if (fd.address2) setAddress2(fd.address2);
      if (fd.zipCode) setZipCode(fd.zipCode);
      if (fd.city) setCity(fd.city);
      if (fd.stateProvince) setStateProvince(fd.stateProvince);
      if (fd.country) setCountry(fd.country);
      if (fd.birthday) setBirthday(new Date(fd.birthday));
      if (fd.countryOfBirth) setCountryOfBirth(fd.countryOfBirth);
      if (fd.citizenship) setCitizenship(fd.citizenship);
      if (fd.mobile) setMobile(fd.mobile);
      if (fd.email) setEmail(fd.email);
      if (fd.emergencyFirstName) setEmergencyFirstName(fd.emergencyFirstName);
      if (fd.emergencyLastName) setEmergencyLastName(fd.emergencyLastName);
      if (fd.emergencyMobile) setEmergencyMobile(fd.emergencyMobile);
      if (fd.mainDuties) setMainDuties(fd.mainDuties);
      if (fd.jobType) setJobType(fd.jobType);
      if (fd.experienceLevel) setExperienceLevel(fd.experienceLevel);
      if (fd.postingLocation) setPostingLocation(fd.postingLocation);
      if (fd.workplaceVaries) setWorkplaceVaries(fd.workplaceVaries);
      if (fd.mainWorkplace) setMainWorkplace(fd.mainWorkplace);
      if (fd.stationing) setStationing(fd.stationing);
      if (fd.employmentForm) setEmploymentForm(fd.employmentForm);
      if (fd.permanentFromDate) setPermanentFromDate(new Date(fd.permanentFromDate));
      if (fd.probationFromDate) setProbationFromDate(new Date(fd.probationFromDate));
      if (fd.probationUntilDate) setProbationUntilDate(new Date(fd.probationUntilDate));
      if (fd.fixedTermFromDate) setFixedTermFromDate(new Date(fd.fixedTermFromDate));
      if (fd.fixedTermUntilDate) setFixedTermUntilDate(new Date(fd.fixedTermUntilDate));
      if (fd.tempReplacementFromDate) setTempReplacementFromDate(new Date(fd.tempReplacementFromDate));
      if (fd.tempReplacementPosition) setTempReplacementPosition(fd.tempReplacementPosition);
      if (fd.tempReplacementNoLaterThan) setTempReplacementNoLaterThan(new Date(fd.tempReplacementNoLaterThan));
      if (fd.seasonalFromDate) setSeasonalFromDate(new Date(fd.seasonalFromDate));
      if (fd.seasonalEndAround) setSeasonalEndAround(new Date(fd.seasonalEndAround));
      if (fd.age69FromDate) setAge69FromDate(new Date(fd.age69FromDate));
      if (fd.age69UntilDate) setAge69UntilDate(new Date(fd.age69UntilDate));
      if (fd.workingTime) setWorkingTime(fd.workingTime);
      if (fd.partTimePercent) setPartTimePercent(fd.partTimePercent);
      if (fd.annualLeaveDays) setAnnualLeaveDays(fd.annualLeaveDays);
      if (fd.salaryType) setSalaryType(fd.salaryType);
      if (fd.hourlyBasic) setHourlyBasic(fd.hourlyBasic);
      if (fd.hourlyPremium) setHourlyPremium(fd.hourlyPremium);
      if (fd.monthlyBasic) setMonthlyBasic(fd.monthlyBasic);
      if (fd.monthlyPremium) setMonthlyPremium(fd.monthlyPremium);
      if (fd.rateApplied) setRateApplied(fd.rateApplied);
      if (fd.pieceWorkPay) setPieceWorkPay(fd.pieceWorkPay);
      if (fd.otherSalaryBenefits) setOtherSalaryBenefits(fd.otherSalaryBenefits);
      if (fd.paymentMethod) setPaymentMethod(fd.paymentMethod);
      if (fd.trainingSkotselskolan !== undefined) setTrainingSkotselskolan(fd.trainingSkotselskolan);
      if (fd.trainingSYN !== undefined) setTrainingSYN(fd.trainingSYN);
      if (fd.trainingOtherEnabled !== undefined) setTrainingOtherEnabled(fd.trainingOtherEnabled);
      if (fd.trainingOtherText) setTrainingOtherText(fd.trainingOtherText);
      if (fd.miscellaneousText) setMiscellaneousText(fd.miscellaneousText);
      setInitialLoaded(true);
    };
    load();
  }, [contractId, initialLoaded]);

  // Fetch agreement periods for salary lookup
  const { data: agreementData } = useQuery({
    queryKey: ["agreement-lookup"],
    queryFn: async () => {
      const [posRes, sgRes, apRes] = await Promise.all([
        supabase.from("positions").select("id, label_en"),
        supabase.from("skill_groups").select("id, label_en"),
        supabase.from("agreement_periods").select("position_id, skill_group_id, hourly_rate, monthly_rate"),
      ]);
      return {
        positions: posRes.data ?? [],
        skillGroups: sgRes.data ?? [],
        agreements: apRes.data ?? [],
      };
    },
  });

  // Look up official rate based on jobType and experienceLevel
  const getOfficialRate = () => {
    if (!agreementData || !jobType || !experienceLevel) return null;
    // jobType is like "Planting / Plantering" — extract the English part before " / "
    const jobEnglish = jobType.split(" / ")[0].trim();
    const pos = agreementData.positions.find(p => p.label_en === jobEnglish);
    // experienceLevel is like "Senior / Senior (3 years / seasons / 3 år / säsonger)"
    // DB label_en is like "Senior (3 years / seasons)" — match by extracting name before " / " or "("
    const expPrefix = experienceLevel.split(" / ")[0].split("(")[0].trim();
    const sg = agreementData.skillGroups.find(s => s.label_en.split("(")[0].trim().toLowerCase() === expPrefix.toLowerCase());
    if (!pos || !sg) return null;
    const ap = agreementData.agreements.find(a => a.position_id === pos.id && a.skill_group_id === sg.id);
    return ap ? { hourly: Number(ap.hourly_rate), monthly: Number(ap.monthly_rate) } : null;
  };

  const officialRate = getOfficialRate();

  const handleApplyRate = () => {
    if (!officialRate) return;
    setHourlyBasic(officialRate.hourly.toString());
    setMonthlyBasic(officialRate.monthly.toString());
    setRateApplied(true);
  };

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getFormData = useCallback(() => ({
    firstName, middleName, lastName, preferredName,
    address, address2, zipCode, city, stateProvince, country,
    birthday: birthday?.toISOString() ?? null,
    countryOfBirth, citizenship, mobile, email,
    emergencyFirstName, emergencyLastName, emergencyMobile,
    mainDuties, jobType, experienceLevel, postingLocation, workplaceVaries, mainWorkplace, stationing,
    employmentForm,
    permanentFromDate: permanentFromDate?.toISOString() ?? null,
    probationFromDate: probationFromDate?.toISOString() ?? null,
    probationUntilDate: probationUntilDate?.toISOString() ?? null,
    fixedTermFromDate: fixedTermFromDate?.toISOString() ?? null,
    fixedTermUntilDate: fixedTermUntilDate?.toISOString() ?? null,
    tempReplacementFromDate: tempReplacementFromDate?.toISOString() ?? null,
    tempReplacementPosition, tempReplacementNoLaterThan: tempReplacementNoLaterThan?.toISOString() ?? null,
    seasonalFromDate: seasonalFromDate?.toISOString() ?? null,
    seasonalEndAround: seasonalEndAround?.toISOString() ?? null,
    age69FromDate: age69FromDate?.toISOString() ?? null,
    age69UntilDate: age69UntilDate?.toISOString() ?? null,
    workingTime, partTimePercent, annualLeaveDays,
    salaryType, hourlyBasic, hourlyPremium, monthlyBasic, monthlyPremium, rateApplied,
    pieceWorkPay, otherSalaryBenefits, paymentMethod,
    trainingSkotselskolan, trainingSYN, trainingOtherEnabled, trainingOtherText,
    miscellaneousText,
  }), [
    firstName, middleName, lastName, preferredName,
    address, address2, zipCode, city, stateProvince, country,
    birthday, countryOfBirth, citizenship, mobile, email,
    emergencyFirstName, emergencyLastName, emergencyMobile,
    mainDuties, jobType, experienceLevel, postingLocation, workplaceVaries, mainWorkplace, stationing,
    employmentForm, permanentFromDate, probationFromDate, probationUntilDate,
    fixedTermFromDate, fixedTermUntilDate, tempReplacementFromDate, tempReplacementPosition, tempReplacementNoLaterThan,
    seasonalFromDate, seasonalEndAround, age69FromDate, age69UntilDate,
    workingTime, partTimePercent, annualLeaveDays,
    salaryType, hourlyBasic, hourlyPremium, monthlyBasic, monthlyPremium, rateApplied,
    pieceWorkPay, otherSalaryBenefits, paymentMethod,
    trainingSkotselskolan, trainingSYN, trainingOtherEnabled, trainingOtherText,
    miscellaneousText,
  ]);

  // Auto-save every 1 second after changes
  useEffect(() => {
    if (!contractId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const { error } = await supabase
          .from("contracts")
          .update({ form_data: getFormData() })
          .eq("id", contractId);
        if (error) throw error;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [getFormData, contractId]);

  // Validation: which required fields are missing per section
  const section21Missing: string[] = [];
  if (!firstName) section21Missing.push("First Name");
  if (!lastName) section21Missing.push("Last Name");
  if (!preferredName) section21Missing.push("Preferred Name");
  if (!address) section21Missing.push("Address 1");
  if (!zipCode) section21Missing.push("ZIP / Postal Code");
  if (!city) section21Missing.push("City");
  if (!stateProvince) section21Missing.push("State / Province");
  if (!country) section21Missing.push("Country");

  const section22Missing: string[] = [];
  if (!birthday) section22Missing.push("Birthday");
  if (!countryOfBirth) section22Missing.push("Country of Birth");
  if (!citizenship) section22Missing.push("Citizenship");
  if (!mobile) section22Missing.push("Mobile Phone Number");
  if (!email) section22Missing.push("Email");

  const section23Missing: string[] = [];
  if (!emergencyFirstName) section23Missing.push("Emergency Contact First Name");
  if (!emergencyLastName) section23Missing.push("Emergency Contact Last Name");
  if (!emergencyMobile) section23Missing.push("Emergency Contact Mobile");

  const section3Missing: string[] = [];
  if (!mainDuties) section3Missing.push("Employed as / Main Duties");
  if (!jobType) section3Missing.push("Job Type");
  if (!experienceLevel) section3Missing.push("Experience Level");
  if (!postingLocation) section3Missing.push("Posting Location");
  if (!workplaceVaries) section3Missing.push("Workplace Varies");
  if (workplaceVaries === "no" && !mainWorkplace) section3Missing.push("Main Workplace");
  

  const section5Missing: string[] = [];
  if (employmentForm === "permanent" && !permanentFromDate) section5Missing.push("Permanent Start Date");
  if (employmentForm === "probationary" && (!probationFromDate || !probationUntilDate)) section5Missing.push("Probation Dates");
  if (employmentForm === "fixed_term" && (!fixedTermFromDate || !fixedTermUntilDate)) section5Missing.push("Fixed-Term Dates");
  if (employmentForm === "temporary_replacement" && !tempReplacementFromDate) section5Missing.push("Temp Replacement Start Date");
  if (employmentForm === "seasonal" && !seasonalFromDate) section5Missing.push("Seasonal Start Date");
  if (employmentForm === "age69" && (!age69FromDate || !age69UntilDate)) section5Missing.push("Age 69 Dates");

  const section6Missing: string[] = [];
  if (workingTime === "parttime" && !partTimePercent) section6Missing.push("Part Time Percentage");

  const section7Missing: string[] = [];
  if (!annualLeaveDays) section7Missing.push("Annual Leave Days");

  const section8Missing: string[] = [];
  if (!rateApplied) section8Missing.push("Apply Official Rate");
  if (salaryType === "hourly" && !hourlyBasic) section8Missing.push("Hourly Basic Rate");
  if (salaryType === "monthly" && !monthlyBasic) section8Missing.push("Monthly Basic Rate");

  const sectionWarnings: Record<string, string[]> = {
    "2.1": section21Missing,
    "2.2": section22Missing,
    "2.3": section23Missing,
    "3": section3Missing,
    "5": section5Missing,
    "6": section6Missing,
    "7": section7Missing,
    "8": section8Missing,
  };

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
  }) => {
    const missing = sectionWarnings[number] || [];
    const hasWarning = missing.length > 0;

    return (
      <div className="space-y-1">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-between rounded-full border px-6 py-3 text-sm font-semibold transition-colors",
            hasWarning
              ? "border-destructive/50 bg-destructive/5 text-primary"
              : "border-primary bg-primary/5 text-primary"
          )}
        >
          <span className="flex items-center gap-2">
            {hasWarning && (
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            )}
            Section {number}: {titleEn} / Sektion {number}: {titleSv}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        {hasWarning && !open && (
          <p className="text-[11px] text-destructive pl-6">
            Missing: {missing.join(", ")}
          </p>
        )}
      </div>
    );
  };

  // Birthday date range: 16-80 years old
  const today = new Date();
  const minBirthDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());
  const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

  const progressSteps = [
    { id: "parties", label: "Parties", icon: Users, sections: ["1", "2.1", "2.2", "2.3"] },
    { id: "employment", label: "Employment", icon: Briefcase, sections: ["3", "4", "5", "6"] },
    { id: "compensation", label: "Compensation", icon: DollarSign, sections: ["7", "8"] },
    { id: "others", label: "Others", icon: MoreHorizontal, sections: [] },
    { id: "review", label: "Review & Sign", icon: CheckCircle, sections: [] },
  ];

  // Determine which progress step is active based on activeSection
  const getActiveProgressIndex = () => {
    if (activeSection === "section-7" || activeSection === "section-8") return 2;
    if (activeSection === "section-3" || activeSection === "section-4" || activeSection === "section-5" || activeSection === "section-6") return 1;
    return 0;
  };
  const activeProgressIdx = getActiveProgressIndex();

  return (
    <div>
      {/* Sticky progress bar */}
      <Card className="shadow-md sticky top-0 z-20 rounded-b-none border-b-0">
        <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Employment contract for workers{" "}
            <span className="text-muted-foreground font-normal text-sm">
              / Anställningsavtal för arbetare
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <span className="flex items-center gap-1.5 text-xs font-normal">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary">Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-destructive">Save failed</span>
                </>
              )}
            </span>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={onBack}>
              Exit / Avsluta
            </Button>
          </div>
        </CardTitle>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
              style={{ width: `${(activeProgressIdx / (progressSteps.length - 1)) * 100}%` }}
            />

            {progressSteps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < activeProgressIdx;
              const isActive = idx === activeProgressIdx;
              const isFuture = idx > activeProgressIdx;

              return (
                <div key={step.id} className="flex flex-col items-center gap-1.5 relative z-10">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isActive && "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30",
                      isFuture && "bg-background border-border text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      (isCompleted || isActive) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      </Card>
      <Card className="shadow-md rounded-t-none border-t-0">
      <CardContent className="space-y-5 pt-5">
        {/* === Employee Details sections (activeSection === "employee") === */}
        {activeSection === "employee" && <>{/* Section 1: Employer Information */}
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

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Employment Section 3 (activeSection === "employment-3") === */}
        {activeSection === "section-3" && <>
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
              {/* Employed as / main duties */}
              <div className="space-y-1.5">
                {renderLabel("Employed as / Main Duties", "Anställd som / Huvudsakliga arbetsuppgifter")}
                {renderField(mainDuties, setMainDuties)}
              </div>

              {/* Job type and salary group */}
              <div className="space-y-1.5">
                {renderLabel("Job Type and Salary Group", "Befattningstyp och lönegrupp")}
                {!jobType && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Required – please select a job type / Obligatoriskt – välj en befattningstyp
                  </p>
                )}
                <Select value={jobType} onValueChange={setJobType} required>
                  <SelectTrigger className={cn("h-11 text-sm font-medium", !jobType && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
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

              {/* Experience level */}
              <div className="space-y-1.5">
                {renderLabel("Experience Level / Salary Group", "Erfarenhet / Lönegrupp")}
                {!experienceLevel && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Required – please select an experience level / Obligatoriskt – välj erfarenhetsnivå
                  </p>
                )}
                <Select value={experienceLevel} onValueChange={setExperienceLevel} required>
                  <SelectTrigger className={cn("h-11 text-sm font-medium", !experienceLevel && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
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

              {/* Posting location */}
              <div className="space-y-1.5">
                {renderLabel("Posting Location", "Stationeringsort")}
                <p className="text-xs text-muted-foreground -mt-1">
                  Used, for example, to calculate travel time compensation / Används till exempel för att beräkna restidsersättning
                </p>
                {renderField(postingLocation, setPostingLocation)}
              </div>

              {/* Workplace varies */}
              <div className="space-y-2">
                {renderLabel("Workplace Varies Between Different Days", "Arbetsplatsen varierar mellan olika dagar")}
                <p className="text-xs text-muted-foreground -mt-1">
                  Workplace (place where the work is to be performed) varies between different days / Arbetsplats (plats där arbetet ska utföras) varierar mellan olika dagar
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workplaceVaries"
                      checked={workplaceVaries === "yes"}
                      onChange={() => setWorkplaceVaries("yes")}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm font-medium">Yes / Ja</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workplaceVaries"
                      checked={workplaceVaries === "no"}
                      onChange={() => setWorkplaceVaries("no")}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm font-medium">No / Nej</span>
                  </label>
                </div>
                {workplaceVaries === "no" && (
                  <div className="space-y-1.5 mt-2">
                    {renderLabel("Main Workplace", "Huvudsaklig arbetsplats")}
                    {renderField(mainWorkplace, setMainWorkplace)}
                  </div>
                )}
              </div>

              {/* Place of Employment / Stationeringsort */}
              <div className="space-y-2">
                {renderLabel("Place of Employment", "Stationeringsort")}
                <div className="space-y-2">
                  <label
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      stationing === "main" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                    )}
                    onClick={() => setStationing("main")}
                  >
                    <div className={cn("mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center", stationing === "main" ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                      {stationing === "main" && <div className="w-2 h-2 rounded-sm bg-primary-foreground" />}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold underline">The main rule / Huvudregeln:</span>{" "}
                      The place of employment is the place where the employee performs the main part of his work. / Stationeringsorten är den plats där arbetstagaren utför huvuddelen av sitt arbete.
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      stationing === "alternative" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                    )}
                    onClick={() => setStationing("alternative")}
                  >
                    <div className={cn("mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center", stationing === "alternative" ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                      {stationing === "alternative" && <div className="w-2 h-2 rounded-sm bg-primary-foreground" />}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold underline">The alternative rule / Alternativregeln:</span>{" "}
                      If the work is performed while moving or at workplaces that are constantly changing, the place of work is instead the place where the employee picks up and leaves work materials or prepares and finishes his work tasks. / Om arbetet utförs under förflyttning eller på arbetsplatser som ständigt växlar, är stationeringsorten i stället den plats där arbetstagaren hämtar och lämnar arbetsmaterial eller förbereder och avslutar sina arbetsuppgifter.
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      stationing === "exception" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                    )}
                    onClick={() => setStationing("exception")}
                  >
                    <div className={cn("mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center", stationing === "exception" ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                      {stationing === "exception" && <div className="w-2 h-2 rounded-sm bg-primary-foreground" />}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold underline">The exception rule / Undantagsregeln:</span>{" "}
                      If the work takes place for a limited time at each location, which applies to certain works in the building and construction industry and similar industries, the residence is a place of employment. / Om arbetet pågår under begränsad tid på varje plats, vilket gäller för vissa arbeten inom byggnads- och anläggningsbranschen och liknande branscher, är bostaden stationeringsort.
                    </div>
                  </label>
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
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Employment Sections 4, 5, 6 (activeSection === "employment-456") === */}
        {activeSection === "section-4" && <>
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
              <div className="rounded-xl border border-border bg-muted/20 p-5">
                <p className="text-sm font-bold mb-1">Collective agreement / Kollektivavtal</p>
                <p className="text-sm text-muted-foreground">
                  The employment arrangement is covered by the collective agreement known as Skogsavtalet [<em>Forest Agreement</em>] between the GS trade union and Gröna arbetsgivare. / Anställningen omfattas av kollektivavtalet Skogsavtalet mellan fackförbundet GS och Gröna arbetsgivare.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 5 (activeSection === "section-5") === */}
        {activeSection === "section-5" && <>
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
              {/* 1. Permanent Employment */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "permanent" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("permanent")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "permanent" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "permanent" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">Permanent employment from / Tillsvidareanställning från</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium ml-auto", !permanentFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {permanentFromDate ? format(permanentFromDate, "yyyy-MM-dd") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={permanentFromDate} onSelect={setPermanentFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] text-muted-foreground align-super">1)</span>
                </div>
              </div>

              {/* 2. Probationary Period */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "probationary" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("probationary")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "probationary" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "probationary" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">Probationary period (max. 6 months) from / Provanställning (max 6 mån) från</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !probationFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {probationFromDate ? format(probationFromDate, "yyyy-MM-dd") : "from"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={probationFromDate} onSelect={setProbationFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">until / till</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !probationUntilDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {probationUntilDate ? format(probationUntilDate, "yyyy-MM-dd") : "until"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={probationUntilDate} onSelect={setProbationUntilDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] text-muted-foreground align-super">2)</span>
                </div>
              </div>

              {/* 3. General Fixed-Term Employment */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "fixed_term" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("fixed_term")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "fixed_term" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "fixed_term" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">General fixed-term employment from / Allmän visstidsanställning från</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !fixedTermFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fixedTermFromDate ? format(fixedTermFromDate, "yyyy-MM-dd") : "from"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={fixedTermFromDate} onSelect={setFixedTermFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">until / till</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !fixedTermUntilDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fixedTermUntilDate ? format(fixedTermUntilDate, "yyyy-MM-dd") : "until"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={fixedTermUntilDate} onSelect={setFixedTermUntilDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] text-muted-foreground align-super">3) and 4)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-8">
                  See also annex for repeated periods of employment on a general fixed-term basis. / Se även bilaga för upprepade perioder av allmän visstidsanställning.
                </p>
              </div>

              {/* 4. Temporary Replacement Employment */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "temporary_replacement" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("temporary_replacement")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "temporary_replacement" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "temporary_replacement" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">Temporary replacement employment from / Vikariat från</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !tempReplacementFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempReplacementFromDate ? format(tempReplacementFromDate, "yyyy-MM-dd") : "from"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={tempReplacementFromDate} onSelect={setTempReplacementFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                {employmentForm === "temporary_replacement" && (
                  <div className="mt-3 ml-8 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      The employment ends when the holder of the regular position returns to work. But no later than: / Anställningen upphör när ordinarie befattningshavare återgår i tjänst. Dock senast:
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">Position / Befattning</label>
                        <Input value={tempReplacementPosition} onChange={(e) => setTempReplacementPosition(e.target.value)} className="h-9 text-sm w-48" placeholder="Position..." onClick={(e) => e.stopPropagation()} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">No later than / Dock senast</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !tempReplacementNoLaterThan && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {tempReplacementNoLaterThan ? format(tempReplacementNoLaterThan, "yyyy-MM-dd") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={tempReplacementNoLaterThan} onSelect={setTempReplacementNoLaterThan} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <span className="text-[10px] text-muted-foreground align-super mt-5">3) and 5)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Seasonal Employment */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "seasonal" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("seasonal")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "seasonal" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "seasonal" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">Seasonal employment from / Säsongsanställning från</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !seasonalFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {seasonalFromDate ? format(seasonalFromDate, "yyyy-MM-dd") : "from"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={seasonalFromDate} onSelect={setSeasonalFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">The season is expected to end around / Säsongen förväntas sluta omkring</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !seasonalEndAround && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {seasonalEndAround ? format(seasonalEndAround, "yyyy-MM-dd") : "end around"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={seasonalEndAround} onSelect={setSeasonalEndAround} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] text-muted-foreground align-super">3)</span>
                </div>
              </div>

              {/* 6. When the employee has reached the age of 69 */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "age69" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setEmploymentForm("age69")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "age69" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "age69" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">When the employee has reached the age of 69 from / När den anställde har fyllt 69 år från</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !age69FromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {age69FromDate ? format(age69FromDate, "yyyy-MM-dd") : "from"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={age69FromDate} onSelect={setAge69FromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">until / till</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !age69UntilDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {age69UntilDate ? format(age69UntilDate, "yyyy-MM-dd") : "until"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={age69UntilDate} onSelect={setAge69UntilDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] text-muted-foreground align-super">3)</span>
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
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 6 (activeSection === "section-6") === */}
        {activeSection === "section-6" && <>
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
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 7: Compensation (activeSection === "section-7") === */}
        {activeSection === "section-7" && <>
        {/* Section 7: Holidays */}
        <Collapsible open={section7Open} onOpenChange={setSection7Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="7"
              titleEn="Holidays"
              titleSv="Semester"
              open={section7Open}
              onToggle={() => setSection7Open(!section7Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">🌴</span>
                    Holiday Entitlement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    {renderLabel("Annual Leave Days", "Semesterdagar")}
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={annualLeaveDays}
                      onChange={(e) => setAnnualLeaveDays(e.target.value)}
                      className="h-11 text-sm font-medium max-w-xs"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 8: Salary (activeSection === "section-8") === */}
        {activeSection === "section-8" && <>
        <Collapsible open={section8Open} onOpenChange={setSection8Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="8"
              titleEn="Salary"
              titleSv="Lön"
              open={section8Open}
              onToggle={() => setSection8Open(!section8Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-5">
              {/* Official Rate Lookup */}
              <Card className={cn(
                "border-2 shadow-sm",
                officialRate ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                          Official Skogsavtalet Rate
                        </p>
                        {officialRate ? (
                          <p className="text-xl font-bold text-foreground">
                            {officialRate.hourly.toFixed(2)} SEK/hr
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {!jobType || !experienceLevel
                              ? "Select Job Type and Experience Level in Section 3 first"
                              : "No matching rate found in agreement data"}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleApplyRate}
                      disabled={!officialRate || rateApplied}
                      className="px-6"
                    >
                      {rateApplied ? "Applied ✓" : "Apply Rate"}
                    </Button>
                  </div>
                  {officialRate && (
                    <p className="text-xs text-muted-foreground mt-2 ml-[52px]">
                      Monthly: {officialRate.monthly.toLocaleString()} SEK/month
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Hourly Pay — PRIMARY */}
              <div
                className={cn(
                  "rounded-xl border-2 p-4 cursor-pointer transition-colors",
                  salaryType === "hourly" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setSalaryType("hourly")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", salaryType === "hourly" ? "border-primary" : "border-muted-foreground/40")}>
                    {salaryType === "hourly" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">Hourly Pay / Timlön **</span>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-8">
                  <div className="space-y-1.5">
                    {renderLabel("Basic pay / Grundlön (SEK/hr)", "", true)}
                    <Input
                      type="number"
                      value={hourlyBasic}
                      onChange={(e) => { setHourlyBasic(e.target.value); }}
                      className="h-11 text-sm font-medium"
                      placeholder="0"
                      disabled={salaryType !== "hourly"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {renderLabel("Premium pay / Premielön (SEK/hr)", "", false)}
                    <Input
                      type="number"
                      value={hourlyPremium}
                      onChange={(e) => setHourlyPremium(e.target.value)}
                      className="h-11 text-sm font-medium"
                      placeholder="0"
                      disabled={salaryType !== "hourly"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Salary — Optional */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  salaryType === "monthly" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setSalaryType("monthly")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", salaryType === "monthly" ? "border-primary" : "border-muted-foreground/40")}>
                    {salaryType === "monthly" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">Monthly Salary / Månadslön **</span>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-8">
                  <div className="space-y-1.5">
                    {renderLabel("Basic salary / Grundlön (SEK/mån)", "", true)}
                    <Input
                      type="number"
                      value={monthlyBasic}
                      onChange={(e) => { setMonthlyBasic(e.target.value); }}
                      className="h-11 text-sm font-medium"
                      placeholder="0"
                      disabled={salaryType !== "monthly"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {renderLabel("Premium salary / Premielön (SEK/mån)", "", false)}
                    <Input
                      type="number"
                      value={monthlyPremium}
                      onChange={(e) => setMonthlyPremium(e.target.value)}
                      className="h-11 text-sm font-medium"
                      placeholder="0"
                      disabled={salaryType !== "monthly"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* Piece-work pay */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  pieceWorkPay ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setPieceWorkPay(!pieceWorkPay)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                    pieceWorkPay ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )}>
                    {pieceWorkPay && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={cn("text-sm font-semibold", !pieceWorkPay && "text-muted-foreground")}>
                    Piece-work pay / Ackordslön * <span className="font-normal text-xs">(specified in "Other" below / specificeras under "Övrigt")</span>
                  </span>
                </div>
              </div>

              {/* Other salary benefits */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  otherSalaryBenefits ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => setOtherSalaryBenefits(!otherSalaryBenefits)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                    otherSalaryBenefits ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )}>
                    {otherSalaryBenefits && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={cn("text-sm font-semibold", !otherSalaryBenefits && "text-muted-foreground")}>
                    Other salary benefits by separate agreement / Andra löneförmåner enligt separat avtal
                  </span>
                </div>
              </div>

              {/* Reference notes */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
                <p>** See Section 7A of Skogsavtalet regarding salary components and that the monthly salary consists of 174 hours' pay.</p>
                <p>* Possible for time-limited employees in forestry work, see Section 7A, Paragraph 2 of Skogsavtalet.</p>
                <p>Regarding rules and compensation for overtime work, see Sections 5 and 8 of Skogsavtalet.</p>
              </div>

              {/* Payment method */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">
                    Payment Method / Utbetalningssätt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "flex-1 rounded-lg border p-3 cursor-pointer transition-colors flex items-center gap-3",
                        paymentMethod === "account" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      )}
                      onClick={() => setPaymentMethod("account")}
                    >
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", paymentMethod === "account" ? "border-primary" : "border-muted-foreground/40")}>
                        {paymentMethod === "account" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">Into the specified account / Till angivet konto</span>
                    </div>
                    <div
                      className={cn(
                        "flex-1 rounded-lg border p-3 cursor-pointer transition-colors flex items-center gap-3",
                        paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      )}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", paymentMethod === "cash" ? "border-primary" : "border-muted-foreground/40")}>
                        {paymentMethod === "cash" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">In cash / Kontant</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No later than on the 25th of each month in arrears or on a fixed date as determined by the employer. If the payment date falls on a day other than Monday–Friday or on a weekend or public holiday, the salary shall normally be paid on the preceding weekday.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button
            className="px-8"
            onClick={onNext}
            disabled={!rateApplied || (salaryType === "hourly" ? !hourlyBasic : !monthlyBasic)}
          >
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 9: Training (activeSection === "section-9") === */}
        {activeSection === "section-9" && <>
        <Collapsible open={section9Open} onOpenChange={setSection9Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="9"
              titleEn="Training"
              titleSv="Utbildning"
              open={section9Open}
              onToggle={() => setSection9Open(!section9Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">📚</span>
                    Mandatory Training / Obligatorisk utbildning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Mandatory training (if appropriate) to which the employee is entitled: / Obligatorisk utbildning (om tillämpligt) som den anställde har rätt till:
                  </p>

                  {/* Skötselskolan */}
                  <button
                    type="button"
                    onClick={() => setTrainingSkotselskolan(!trainingSkotselskolan)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
                      trainingSkotselskolan
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      trainingSkotselskolan ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {trainingSkotselskolan && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Skötselskolan</p>
                      <p className="text-xs text-muted-foreground">
                        Forestry care and management training program / Utbildningsprogram för skogsvård och skötsel
                      </p>
                    </div>
                  </button>

                  {/* SYN */}
                  <button
                    type="button"
                    onClick={() => setTrainingSYN(!trainingSYN)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
                      trainingSYN
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      trainingSYN ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {trainingSYN && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Skogsbrukets yrkesnämnd (SYN)</p>
                      <p className="text-xs text-muted-foreground">
                        Forestry vocational board – safety &amp; project handling certification / Skogsbrukets yrkesnämnd – säkerhet &amp; projekthanteringscertifiering
                      </p>
                    </div>
                  </button>

                  {/* Other */}
                  <button
                    type="button"
                    onClick={() => setTrainingOtherEnabled(!trainingOtherEnabled)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
                      trainingOtherEnabled
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      trainingOtherEnabled ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {trainingOtherEnabled && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Other Training / Annan utbildning</p>
                      <p className="text-xs text-muted-foreground">
                        Additional training requirements / Ytterligare utbildningskrav
                      </p>
                    </div>
                  </button>

                  {trainingOtherEnabled && (
                    <textarea
                      value={trainingOtherText}
                      onChange={(e) => setTrainingOtherText(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Describe additional training... / Beskriv ytterligare utbildning..."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 10: Social Security (activeSection === "section-10") === */}
        {activeSection === "section-10" && <>
        <Collapsible open={section10Open} onOpenChange={setSection10Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="10"
              titleEn="Social Security"
              titleSv="Socialförsäkring"
              open={section10Open}
              onToggle={() => setSection10Open(!section10Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">🛡️</span>
                    Social Security / Socialförsäkring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-3">
                    <p className="text-sm leading-relaxed">
                      The employer pays employer's contributions to the state in accordance with the Swedish Social Security Act (2000:980).
                    </p>
                    <p className="text-sm leading-relaxed">
                      Employed workers are entitled to sick pay in accordance with the Swedish Sick Pay Act (1991:1047) and the following collective agreement-based benefits:
                    </p>
                    <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 pl-2">
                      <li>Contractual pension SAF-LO</li>
                      <li>Contractual group health insurance (AGS)</li>
                      <li>Parental benefit supplement (FPT)</li>
                      <li>Employment transition fund (TSL)</li>
                      <li>Occupational injury insurance (TFA)</li>
                      <li>Occupational group life insurance</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-3">
                    <p className="text-sm leading-relaxed italic text-muted-foreground">
                      Arbetsgivaren betalar arbetsgivaravgifter till staten i enlighet med socialförsäkringsbalken (2000:980).
                    </p>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">
                      Anställda arbetstagare har rätt till sjuklön enligt sjuklönelagen (1991:1047) och följande kollektivavtalsbaserade förmåner:
                    </p>
                    <ul className="text-sm leading-relaxed italic text-muted-foreground list-disc list-inside space-y-1 pl-2">
                      <li>Avtalspension SAF-LO</li>
                      <li>Avtalsgruppsjukförsäkring (AGS)</li>
                      <li>Föräldrapenningtillägg (FPT)</li>
                      <li>Omställningsförsäkring (TSL)</li>
                      <li>Trygghetsförsäkring vid arbetsskada (TFA)</li>
                      <li>Tjänstegrupplivförsäkring</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}

        {/* === Section 11: Miscellaneous (activeSection === "section-11") === */}
        {activeSection === "section-11" && <>
        <Collapsible open={section11Open} onOpenChange={setSection11Open}>
          <CollapsibleTrigger asChild>
            <SectionHeader
              number="11"
              titleEn="Miscellaneous"
              titleSv="Övrigt"
              open={section11Open}
              onToggle={() => setSection11Open(!section11Open)}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">📝</span>
                    Miscellaneous / Övrigt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    State any other terms and conditions for the employment arrangement, e.g. pay and benefits in addition to the applicable collective agreement. / Ange övriga villkor för anställningen, t.ex. lön och förmåner utöver tillämpligt kollektivavtal.
                  </p>
                  <textarea
                    value={miscellaneousText}
                    onChange={(e) => setMiscellaneousText(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter additional terms and conditions... / Ange ytterligare villkor..."
                  />
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back / Tillbaka
          </Button>
          <Button className="px-8" onClick={onNext}>
            Next Step / Nästa
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        </>}
      </CardContent>
    </Card>
    </div>
  );
}
