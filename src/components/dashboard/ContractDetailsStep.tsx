import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CONTRACT_PRINT_CSS } from "@/lib/contract-print-styles";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { differenceInMonths, differenceInDays } from "date-fns";
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
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { getFormLabel, getFormSectionLabel, getFormBilingual } from "@/lib/form-translations";
import { Building2, ChevronDown, ArrowLeft, ArrowRight, User, ShieldCheck, Users, Briefcase, DollarSign, MoreHorizontal, CheckCircle, Check, AlertTriangle, Cloud, CloudOff, Loader2, Lightbulb, Printer } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignatureCanvas } from "./SignatureCanvas";
import { ContractDocument } from "./ContractDocument";
import { SchedulingStep, type SchedulingData } from "./SchedulingStep";
import { COC_MAP } from "./CodeOfConductViewer";
import {
  CONTRACT_LABELS as CL,
  bilingualLabel as bl_label,
  translateDayType,
  type LangCode,
} from "@/lib/contract-translations";

/** Map contract language code to CoC language key */
function cocLangKey(lang: string): string {
  switch (lang) {
    case "SE": return "sv";
    case "RO/SE": return "ro";
    case "TH/SE": return "th";
    case "UK/SE": return "uk";
    default: return "en";
  }
}

function fmtDatePrint(val: string | null | undefined): string {
  if (!val) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return val; }
}

function escHtml(v: any): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
  activeSection: "employee" | "section-3" | "section-4" | "section-5" | "section-6" | "section-7" | "section-8" | "section-9" | "section-10" | "section-11" | "section-12" | "section-13" | "section-scheduling" | "section-14";
  onBack: () => void;
  onNext: () => void;
  onGoToStep?: (step: number) => void;
}

const COUNTRIES = [
  "Sweden", "Romania", "Poland", "Ukraine", "Lithuania", "Latvia",
  "Estonia", "Germany", "Spain", "France", "Thailand",
];

// JOB_TYPES now fetched dynamically from the positions table

import { EXPERIENCE_LEVELS_BASE, getExperienceLevelLabel } from "@/lib/contract-translations";

// Original format kept as values for backward compatibility
const EXPERIENCE_LEVELS = EXPERIENCE_LEVELS_BASE.map(
  (l) => `${l.en} / ${l.sv} (${l.detail_en} / ${l.detail_sv})`
);

export function ContractDetailsStep({
  company,
  employee,
  contractId,
  activeSection,
  onBack,
  onNext,
  onGoToStep,
}: ContractDetailsStepProps) {
  // Fetch active positions from DB
  const { data: activePositions = [] } = useQuery({
    queryKey: ["positions-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("type_number")
        .order("sort_order");
      if (error) throw error;
      // Filter active positions (is_active defaults to true)
      return (data || []).filter((p: any) => p.is_active !== false);
    },
  });

  // jobTypeGroups moved below contractLanguage state declaration

  const [section1Open, setSection1Open] = useState(false);
  const [section21Open, setSection21Open] = useState(true);
  const [section22Open, setSection22Open] = useState(true);
  const [section23Open, setSection23Open] = useState(true);
  const [section3Open, setSection3Open] = useState(true);
  const [section4Open, setSection4Open] = useState(true);
  const [section5Open, setSection5Open] = useState(true);
  const [section6Open, setSection6Open] = useState(true);
  const [section7Open, setSection7Open] = useState(true);

  const pi = (employee.personal_info ?? {}) as Record<string, any>;

  // Employee form state — read camelCase keys (from onboarding) with snake_case fallback
  const [firstName, setFirstName] = useState(employee.first_name ?? "");
  const [middleName, setMiddleName] = useState(employee.middle_name ?? "");
  const [lastName, setLastName] = useState(employee.last_name ?? "");
  const [preferredName, setPreferredName] = useState(pi.preferredName ?? pi.preferred_name ?? "");
  const [address, setAddress] = useState(pi.address1 ?? "");
  const [address2, setAddress2] = useState(pi.address2 ?? "");
  const [zipCode, setZipCode] = useState(pi.zipCode ?? pi.zip_code ?? "");
  const [city, setCity] = useState(employee.city ?? pi.city ?? "");
  const [stateProvince, setStateProvince] = useState(pi.stateProvince ?? pi.state_province ?? "");
  const [country, setCountry] = useState(employee.country ?? pi.country ?? "");
  const [birthday, setBirthday] = useState<Date | undefined>(
    pi.birthday ? new Date(pi.birthday) : undefined
  );
  const [countryOfBirth, setCountryOfBirth] = useState(pi.countryOfBirth ?? pi.country_of_birth ?? "");
  const [citizenship, setCitizenship] = useState(pi.citizenship ?? "");
  const [mobile, setMobile] = useState(employee.phone ?? pi.mobilePhone ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const ec = (pi.emergencyContact ?? pi.emergency_contact ?? {}) as Record<string, any>;
  const [emergencyFirstName, setEmergencyFirstName] = useState(pi.emergencyFirstName ?? pi.emergency_first_name ?? ec.firstName ?? ec.first_name ?? "");
  const [emergencyLastName, setEmergencyLastName] = useState(pi.emergencyLastName ?? pi.emergency_last_name ?? ec.lastName ?? ec.last_name ?? "");
  const [emergencyMobile, setEmergencyMobile] = useState(pi.emergencyPhone ?? pi.emergency_mobile ?? ec.phone ?? ec.mobile ?? "");

  // Section 3 state
  const [mainDuties, setMainDuties] = useState("Forest Worker / Skogsarbetare");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [jobType2, setJobType2] = useState("");
  const [experienceLevel2, setExperienceLevel2] = useState("");
  const [jobType3, setJobType3] = useState("");
  const [experienceLevel3, setExperienceLevel3] = useState("");
  const [numberOfJobTypes, setNumberOfJobTypes] = useState<"" | "1" | "2" | "3">("");
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
  const [sinkEnabled, setSinkEnabled] = useState(false);
  const [sinkConfirmed, setSinkConfirmed] = useState(false);
  const [sinkHighlight, setSinkHighlight] = useState(false);
  const [showSinkQuestion, setShowSinkQuestion] = useState(false);
  const [age69FromDate, setAge69FromDate] = useState<Date | undefined>(undefined);
  const [age69UntilDate, setAge69UntilDate] = useState<Date | undefined>(undefined);

  const handleEmploymentFormChange = (form: string) => {
    setEmploymentForm(form);
    setSinkConfirmed(false);
    setShowSinkQuestion(false);
    setSinkHighlight(false);
  };

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
  const [hourlyBasic2, setHourlyBasic2] = useState("");
  const [hourlyPremium2, setHourlyPremium2] = useState("");
  const [monthlyBasic2, setMonthlyBasic2] = useState("");
  const [monthlyPremium2, setMonthlyPremium2] = useState("");
  const [hourlyBasic3, setHourlyBasic3] = useState("");
  const [hourlyPremium3, setHourlyPremium3] = useState("");
  const [monthlyBasic3, setMonthlyBasic3] = useState("");
  const [monthlyPremium3, setMonthlyPremium3] = useState("");
  const [companyPremiumPercent, setCompanyPremiumPercent] = useState("0");
  const [contractLanguage, setContractLanguage] = useState("EN/SE");

  // Group active positions by type for the dropdown (language-aware)
  const jobTypeGroups = activePositions.reduce<Array<{ group: string; items: Array<{ label: string; value: string }> }>>((acc, pos: any) => {
    const primaryTypeLabel = contractLanguage === "SE" ? pos.type_label_sv
      : contractLanguage === "RO/SE" ? (pos.type_label_ro || pos.type_label_en)
      : contractLanguage === "TH/SE" ? (pos.type_label_th || pos.type_label_en)
      : contractLanguage === "UK/SE" ? (pos.type_label_uk || pos.type_label_en)
      : pos.type_label_en;
    const groupLabel = contractLanguage === "SE"
      ? `Typ ${pos.type_number}: ${pos.type_label_sv}`
      : `Type ${pos.type_number}: ${primaryTypeLabel}${pos.type_label_sv ? ` / ${pos.type_label_sv}` : ''}`;
    let group = acc.find(g => g.group === groupLabel);
    if (!group) {
      group = { group: groupLabel, items: [] };
      acc.push(group);
    }
    const primaryLabel = contractLanguage === "SE" ? pos.label_sv
      : contractLanguage === "RO/SE" ? (pos.label_ro || pos.label_en)
      : contractLanguage === "TH/SE" ? (pos.label_th || pos.label_en)
      : contractLanguage === "UK/SE" ? (pos.label_uk || pos.label_en)
      : pos.label_en;
    const displayLabel = contractLanguage === "SE" ? pos.label_sv : `${primaryLabel} / ${pos.label_sv}`;
    group.items.push({ label: displayLabel, value: `${pos.label_en} / ${pos.label_sv}` });
    return acc;
  }, []);
  const [pieceWorkPay, setPieceWorkPay] = useState(false);
  const [otherSalaryBenefits, setOtherSalaryBenefits] = useState(false);
  const [showSalaryPrompt, setShowSalaryPrompt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"account" | "cash">("account");
  const [rateApplied, setRateApplied] = useState(false);
  const [rateApplied2, setRateApplied2] = useState(false);
  const [rateApplied3, setRateApplied3] = useState(false);
  const [section8Open, setSection8Open] = useState(true);
  const [showRateWarning, setShowRateWarning] = useState(false);

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

  // Section 13: Salary Deductions
  const [section13Open, setSection13Open] = useState(true);
  type SalaryDeduction = {
    id: string;
    type: string;
    label: string;
    amount: string;
    frequency: string;
    note: string;
    [key: string]: string;
  };
  const DEDUCTION_TYPES = [
    { value: "rent", label: "Rent / Accommodation", labelSv: "Hyra / Boende" },
    { value: "car", label: "Company Car Usage", labelSv: "Tjänstebil" },
    { value: "travel", label: "Travel Costs", labelSv: "Resekostnader" },
    { value: "immigration", label: "Immigration Process Fees", labelSv: "Migrationsverkets avgifter" },
    { value: "other", label: "Other Deduction", labelSv: "Annat avdrag" },
  ];
  const [salaryDeductions, setSalaryDeductions] = useState<SalaryDeduction[]>([]);
  const [deductionsConfirmed, setDeductionsConfirmed] = useState(false);

  // Scheduling state
  const defaultSeasonYear = new Date().getFullYear();
  const [schedulingData, setSchedulingData] = useState<SchedulingData>({
    seasonYear: defaultSeasonYear,
    contractStartDate: `${defaultSeasonYear}-02-01`,
    contractEndDate: `${defaultSeasonYear}-11-30`,
    weeklyHours: 40,
    startTime: "06:30",
    endTime: "17:00",
    workStartDate: `${defaultSeasonYear}-03-01`,
    workEndDate: `${defaultSeasonYear}-10-31`,
    vacationEnabled: false,
    vacationStartDate: `${defaultSeasonYear}-07-01`,
    vacationEndDate: `${defaultSeasonYear}-07-31`,
    attachToContract: false,
  });

  // Sync Section 5 employment dates into scheduling duration
  useEffect(() => {
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (employmentForm === "seasonal" && seasonalFromDate) {
      startDate = format(seasonalFromDate, "yyyy-MM-dd");
      if (seasonalEndAround) endDate = format(seasonalEndAround, "yyyy-MM-dd");
    } else if (employmentForm === "fixed_term" && fixedTermFromDate) {
      startDate = format(fixedTermFromDate, "yyyy-MM-dd");
      if (fixedTermUntilDate) endDate = format(fixedTermUntilDate, "yyyy-MM-dd");
    } else if (employmentForm === "age69" && age69FromDate) {
      startDate = format(age69FromDate, "yyyy-MM-dd");
      if (age69UntilDate) endDate = format(age69UntilDate, "yyyy-MM-dd");
    }

    if (startDate || endDate) {
      setSchedulingData(prev => ({
        ...prev,
        ...(startDate ? { contractStartDate: startDate } : {}),
        ...(endDate ? { contractEndDate: endDate } : {}),
      }));
    }
  }, [employmentForm, seasonalFromDate, seasonalEndAround, fixedTermFromDate, fixedTermUntilDate, age69FromDate, age69UntilDate]);


  const [signingStatus, setSigningStatus] = useState("not_sent");
  const [signingLink, setSigningLink] = useState("");
  const [employeeSignatureUrl, setEmployeeSignatureUrl] = useState("");
  const [employerSignatureUrl, setEmployerSignatureUrl] = useState("");
  const [sendingForSigning, setSendingForSigning] = useState(false);
  const [submittingEmployerSig, setSubmittingEmployerSig] = useState(false);
  
  const [contractCode, setContractCode] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch schedule rows for print appendix
  const { data: printScheduleRows } = useQuery({
    queryKey: ["contract-schedule-print", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_schedules")
        .select("*")
        .eq("contract_id", contractId)
        .order("schedule_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contractId,
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    const lang: LangCode = contractLanguage as LangCode || "EN/SE";
    const isSEOnly = lang === "SE";

    // Build Appendix A — Code of Conduct HTML
    let cocHtml = "";
    const cocPrimaryKey = cocLangKey(lang);
    const cocPrimary = !isSEOnly ? COC_MAP[cocPrimaryKey] : null;
    const cocSv = COC_MAP["sv"];

    cocHtml += `<div style="page-break-before:always;"></div>`;
    cocHtml += `<h2 class="section-title">${bl_label(CL.appendixCoC, lang)}</h2>`;

    if (cocPrimary && cocPrimaryKey !== "sv") {
      cocHtml += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${escHtml(cocPrimary.title)}</h3>`;
      cocHtml += `<div class="coc-section">`;
      for (const s of cocPrimary.sections) {
        if (s.heading) cocHtml += `<p class="coc-heading">${escHtml(s.heading)}</p>`;
        cocHtml += `<p class="coc-body">${escHtml(s.body)}</p>`;
      }
      cocHtml += `</div>`;
      cocHtml += `<div style="page-break-before:always;"></div>`;
    }

    cocHtml += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${escHtml(cocSv.title)}</h3>`;
    cocHtml += `<div class="coc-section">`;
    for (const s of cocSv.sections) {
      if (s.heading) cocHtml += `<p class="coc-heading">${escHtml(s.heading)}</p>`;
      cocHtml += `<p class="coc-body">${escHtml(s.body)}</p>`;
    }
    cocHtml += `</div>`;

    // Build Appendix B — Work Schedule HTML
    let scheduleHtml = "";
    scheduleHtml += `<div style="page-break-before:always;"></div>`;
    scheduleHtml += `<h2 class="section-title">${bl_label(CL.appendixSchedule, lang)}</h2>`;

    const rows = printScheduleRows || [];
    if (rows.length > 0) {
      scheduleHtml += `<table class="schedule-table"><thead><tr>`;
      scheduleHtml += `<th>${bl_label(CL.scheduleDate, lang)}</th>`;
      scheduleHtml += `<th>${bl_label(CL.scheduleDayType, lang)}</th>`;
      scheduleHtml += `<th>${bl_label(CL.scheduleHours, lang)}</th>`;
      scheduleHtml += `<th>${bl_label(CL.scheduleStart, lang)}</th>`;
      scheduleHtml += `<th>${bl_label(CL.scheduleEnd, lang)}</th>`;
      scheduleHtml += `<th>${bl_label(CL.scheduleHoliday, lang)}</th>`;
      scheduleHtml += `</tr></thead><tbody>`;

      for (const row of rows) {
        const isHoliday = row.day_type === "Holiday";
        const isWeekend = row.day_type === "Weekend";
        const trClass = isHoliday ? ' class="holiday"' : isWeekend ? ' class="weekend"' : '';
        const holidayName = lang === "SE" ? (row.holiday_name_sv || "") : (row.holiday_name_en || row.holiday_name_sv || "");
        scheduleHtml += `<tr${trClass}>`;
        scheduleHtml += `<td>${fmtDatePrint(row.schedule_date)}</td>`;
        scheduleHtml += `<td>${escHtml(translateDayType(row.day_type, lang))}</td>`;
        scheduleHtml += `<td>${row.scheduled_hours}</td>`;
        scheduleHtml += `<td>${escHtml(row.start_time) || "—"}</td>`;
        scheduleHtml += `<td>${escHtml(row.end_time) || "—"}</td>`;
        scheduleHtml += `<td>${escHtml(holidayName) || "—"}</td>`;
        scheduleHtml += `</tr>`;
      }
      scheduleHtml += `</tbody></table>`;

      const totalHours = rows.reduce((sum, r) => sum + (Number(r.scheduled_hours) || 0), 0);
      const workdays = rows.filter((r) => r.day_type === "Workday").length;
      scheduleHtml += `<p style="font-size:8.5pt;color:#555;margin-top:6px;">Total: ${totalHours}h · ${workdays} workdays</p>`;
    } else {
      scheduleHtml += `<p class="info-text-muted">${bl_label(CL.noSchedule, lang)}</p>`;
    }

    const appendixCss = `
      .coc-section { margin-bottom: 12px; }
      .coc-heading { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 9pt; font-weight: 700; margin-top: 8px; margin-bottom: 2px; }
      .coc-body { font-size: 8.5pt; line-height: 1.45; white-space: pre-line; margin-bottom: 4px; }
      .schedule-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 8.5pt; }
      .schedule-table th { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 3px 6px; border-bottom: 2px solid #999; }
      .schedule-table td { padding: 3px 6px; border-bottom: 1px solid #ddd; }
      .schedule-table tr.weekend { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .schedule-table tr.holiday { background: #fef3c7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Employment Contract / Anställningsavtal${contractCode ? ` — ${contractCode}` : ''}</title>
<style>${CONTRACT_PRINT_CSS}${appendixCss}</style>
</head>
<body>${printContent.innerHTML}${cocHtml}${scheduleHtml}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  // Load signing status from contract
  useEffect(() => {
    if (!contractId) return;
    const loadSigning = async () => {
      const { data } = await supabase
        .from("contracts")
        .select("signing_status, signing_token, employee_signature_url, employer_signature_url")
        .eq("id", contractId)
        .single();
      if (data) {
        setSigningStatus(data.signing_status || "not_sent");
        if (data.signing_token) {
          setSigningLink(`${window.location.origin}/sign/${data.signing_token}`);
        }
        if (data.employee_signature_url) setEmployeeSignatureUrl(data.employee_signature_url);
        if (data.employer_signature_url) setEmployerSignatureUrl(data.employer_signature_url);
      }
    };
    loadSigning();
  }, [contractId]);

  const handleSendForSigning = async () => {
    // Pre-send validation: employer data must be complete
    if (!company) {
      toast.error("No company selected. Please select a company before sending for signing.");
      return;
    }
    const missingFields: string[] = [];
    if (!company.name) missingFields.push("Company name");
    if (!company.org_number) missingFields.push("Org number");
    if (!company.address) missingFields.push("Address");
    if (!company.postcode) missingFields.push("Postcode");
    if (!company.city) missingFields.push("City");
    if (missingFields.length > 0) {
      toast.error(`Employer data incomplete: ${missingFields.join(", ")}. Please complete the company register first.`);
      return;
    }

    setSendingForSigning(true);
    try {
      // Build companySnapshot and persist company_id + form_data before sending
      const companySnapshot = {
        name: company.name,
        orgNumber: company.org_number,
        address: company.address,
        postcode: company.postcode,
        city: company.city,
      };
      const currentFormData = { ...getFormData(), companySnapshot };
      const { error: saveErr } = await supabase
        .from("contracts")
        .update({
          form_data: currentFormData,
          company_id: company.id,
        })
        .eq("id", contractId)
        .eq("signing_status", "not_sent");
      if (saveErr) {
        console.warn("Pre-send save failed:", saveErr);
      }

      const { data, error } = await supabase.functions.invoke("send-signing-email", {
        body: { contractId },
      });
      if (error) throw error;
      if (data?.signingToken) {
        setSigningLink(data.signingUrl || `https://erptable.lovable.app/sign/${data.signingToken}`);
        setSigningStatus("sent_to_employee");
        if (data.emailSent) {
          toast.success("Signing email sent / Signeringsmail skickat", {
            description: `Email sent to ${data.employeeEmail || "employee"}. / E-post skickad till ${data.employeeEmail || "anställd"}.`,
          });
        } else {
          toast.warning("Contract ready for signing / Avtal redo för signering", {
            description: "Email could not be sent. Use the link below to share manually. / E-post kunde inte skickas. Använd länken nedan för att dela manuellt.",
          });
        }
      }
    } catch (err) {
      console.error("Failed to send for signing:", err);
      toast.error("Failed to prepare contract for signing.");
    } finally {
      setSendingForSigning(false);
    }
  };

  const handleEmployerSign = async (dataUrl: string) => {
    setSubmittingEmployerSig(true);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filePath = `employer/${contractId}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("signatures")
        .upload(filePath, blob, { upsert: true, contentType: "image/png" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(filePath);

      const { error: updateErr } = await supabase
        .from("contracts")
        .update({
          employer_signature_url: urlData.publicUrl,
          employer_signed_at: new Date().toISOString(),
          signing_status: "employer_signed",
          signed_at: new Date().toISOString(),
          status: "signed",
        })
        .eq("id", contractId);
      if (updateErr) throw updateErr;

      setEmployerSignatureUrl(urlData.publicUrl);
      setSigningStatus("employer_signed");
    } catch (err) {
      console.error("Failed to save employer signature:", err);
    } finally {
      setSubmittingEmployerSig(false);
    }
  };



  // Load saved form_data from the contract on mount
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (initialLoaded || !contractId) return;
    const load = async () => {
      const { data } = await supabase
        .from("contracts")
        .select("form_data, contract_code, season_year")
        .eq("id", contractId)
        .single();
      if (data?.contract_code) setContractCode(data.contract_code);
      if (data?.season_year) setSeasonYear(data.season_year);
      if (!data?.form_data) { setInitialLoaded(true); return; }
      const fd = data.form_data as Record<string, any>;
      if (fd.firstName !== undefined) setFirstName(fd.firstName);
      if (fd.middleName !== undefined) setMiddleName(fd.middleName);
      if (fd.lastName !== undefined) setLastName(fd.lastName);
      if (fd.preferredName !== undefined) setPreferredName(fd.preferredName);
      if (fd.address !== undefined) setAddress(fd.address);
      if (fd.address2 !== undefined) setAddress2(fd.address2);
      if (fd.zipCode !== undefined) setZipCode(fd.zipCode);
      if (fd.city !== undefined) setCity(fd.city);
      if (fd.stateProvince !== undefined) setStateProvince(fd.stateProvince);
      if (fd.country !== undefined) setCountry(fd.country);
      if (fd.birthday) setBirthday(new Date(fd.birthday));
      if (fd.countryOfBirth !== undefined) setCountryOfBirth(fd.countryOfBirth);
      if (fd.citizenship !== undefined) setCitizenship(fd.citizenship);
      if (fd.mobile !== undefined) setMobile(fd.mobile);
      if (fd.email !== undefined) setEmail(fd.email);
      if (fd.emergencyFirstName !== undefined) {
        setEmergencyFirstName(fd.emergencyFirstName || pi.emergencyFirstName || pi.emergency_first_name || ec.firstName || ec.first_name || "");
      }
      if (fd.emergencyLastName !== undefined) {
        setEmergencyLastName(fd.emergencyLastName || pi.emergencyLastName || pi.emergency_last_name || ec.lastName || ec.last_name || "");
      }
      if (fd.emergencyMobile !== undefined) {
        setEmergencyMobile(fd.emergencyMobile || pi.emergencyPhone || pi.emergency_mobile || ec.phone || ec.mobile || "");
      }
      if (fd.mainDuties !== undefined) setMainDuties(fd.mainDuties);
      if (fd.jobType !== undefined) setJobType(fd.jobType);
      if (fd.experienceLevel !== undefined) setExperienceLevel(fd.experienceLevel);
      if (fd.numberOfJobTypes !== undefined) setNumberOfJobTypes(fd.numberOfJobTypes);
      else if (fd.jobType3) setNumberOfJobTypes("3");
      else if (fd.jobType2) setNumberOfJobTypes("2");
      else if (fd.jobType) setNumberOfJobTypes("1");
      if (fd.jobType2 !== undefined) setJobType2(fd.jobType2);
      if (fd.experienceLevel2 !== undefined) setExperienceLevel2(fd.experienceLevel2);
      if (fd.jobType3 !== undefined) setJobType3(fd.jobType3);
      if (fd.experienceLevel3 !== undefined) setExperienceLevel3(fd.experienceLevel3);
      if (fd.postingLocation !== undefined) setPostingLocation(fd.postingLocation);
      if (fd.workplaceVaries !== undefined) setWorkplaceVaries(fd.workplaceVaries);
      if (fd.mainWorkplace !== undefined) setMainWorkplace(fd.mainWorkplace);
      if (fd.stationing !== undefined) setStationing(fd.stationing);
      if (fd.employmentForm !== undefined) setEmploymentForm(fd.employmentForm);
      if (fd.permanentFromDate) setPermanentFromDate(new Date(fd.permanentFromDate));
      if (fd.probationFromDate) setProbationFromDate(new Date(fd.probationFromDate));
      if (fd.probationUntilDate) setProbationUntilDate(new Date(fd.probationUntilDate));
      if (fd.fixedTermFromDate) setFixedTermFromDate(new Date(fd.fixedTermFromDate));
      if (fd.fixedTermUntilDate) setFixedTermUntilDate(new Date(fd.fixedTermUntilDate));
      if (fd.tempReplacementFromDate) setTempReplacementFromDate(new Date(fd.tempReplacementFromDate));
      if (fd.tempReplacementPosition !== undefined) setTempReplacementPosition(fd.tempReplacementPosition);
      if (fd.tempReplacementNoLaterThan) setTempReplacementNoLaterThan(new Date(fd.tempReplacementNoLaterThan));
      if (fd.seasonalFromDate) setSeasonalFromDate(new Date(fd.seasonalFromDate));
      if (fd.seasonalEndAround) setSeasonalEndAround(new Date(fd.seasonalEndAround));
      if (fd.sinkEnabled != null) setSinkEnabled(fd.sinkEnabled);
      if (fd.sinkConfirmed != null) setSinkConfirmed(fd.sinkConfirmed);
      if (fd.age69FromDate) setAge69FromDate(new Date(fd.age69FromDate));
      if (fd.age69UntilDate) setAge69UntilDate(new Date(fd.age69UntilDate));
      if (fd.workingTime !== undefined) setWorkingTime(fd.workingTime);
      if (fd.partTimePercent !== undefined) setPartTimePercent(fd.partTimePercent);
      if (fd.annualLeaveDays !== undefined) setAnnualLeaveDays(fd.annualLeaveDays);
      if (fd.salaryType !== undefined) setSalaryType(fd.salaryType);
      if (fd.hourlyBasic !== undefined) setHourlyBasic(fd.hourlyBasic);
      if (fd.hourlyPremium !== undefined) setHourlyPremium(fd.hourlyPremium);
      if (fd.monthlyBasic !== undefined) setMonthlyBasic(fd.monthlyBasic);
      if (fd.monthlyPremium !== undefined) setMonthlyPremium(fd.monthlyPremium);
      if (fd.hourlyBasic2 !== undefined) setHourlyBasic2(fd.hourlyBasic2);
      if (fd.hourlyPremium2 !== undefined) setHourlyPremium2(fd.hourlyPremium2);
      if (fd.monthlyBasic2 !== undefined) setMonthlyBasic2(fd.monthlyBasic2);
      if (fd.monthlyPremium2 !== undefined) setMonthlyPremium2(fd.monthlyPremium2);
      if (fd.hourlyBasic3 !== undefined) setHourlyBasic3(fd.hourlyBasic3);
      if (fd.hourlyPremium3 !== undefined) setHourlyPremium3(fd.hourlyPremium3);
      if (fd.monthlyBasic3 !== undefined) setMonthlyBasic3(fd.monthlyBasic3);
      if (fd.monthlyPremium3 !== undefined) setMonthlyPremium3(fd.monthlyPremium3);
      if (fd.companyPremiumPercent !== undefined) setCompanyPremiumPercent(fd.companyPremiumPercent);
      if (fd.contractLanguage !== undefined) setContractLanguage(fd.contractLanguage);
      if (fd.rateApplied !== undefined) setRateApplied(fd.rateApplied);
      if (fd.rateApplied2 !== undefined) setRateApplied2(fd.rateApplied2);
      if (fd.rateApplied3 !== undefined) setRateApplied3(fd.rateApplied3);
      if (fd.pieceWorkPay !== undefined) setPieceWorkPay(fd.pieceWorkPay);
      if (fd.otherSalaryBenefits !== undefined) setOtherSalaryBenefits(fd.otherSalaryBenefits);
      if (fd.paymentMethod !== undefined) setPaymentMethod(fd.paymentMethod);
      if (fd.trainingSkotselskolan !== undefined) setTrainingSkotselskolan(fd.trainingSkotselskolan);
      if (fd.trainingSYN !== undefined) setTrainingSYN(fd.trainingSYN);
      if (fd.trainingOtherEnabled !== undefined) setTrainingOtherEnabled(fd.trainingOtherEnabled);
      if (fd.trainingOtherText !== undefined) setTrainingOtherText(fd.trainingOtherText);
      if (fd.miscellaneousText !== undefined) setMiscellaneousText(fd.miscellaneousText);
      if (fd.salaryDeductions !== undefined) setSalaryDeductions(fd.salaryDeductions);
      if (fd.deductionsConfirmed !== undefined) setDeductionsConfirmed(fd.deductionsConfirmed);
      if (fd.schedulingData) setSchedulingData(fd.schedulingData);
      setInitialLoaded(true);
    };
    load();
  }, [contractId, initialLoaded]);

  // Track previous values so we only reset rateApplied on actual user-driven changes
  const prevSalaryDeps1 = useRef<string>("");
  const prevSalaryDeps2 = useRef<string>("");
  const prevSalaryDeps3 = useRef<string>("");

  useEffect(() => {
    if (!initialLoaded) return;
    const key = `${jobType}|${experienceLevel}|${companyPremiumPercent}`;
    if (prevSalaryDeps1.current === "") {
      prevSalaryDeps1.current = key;
      return;
    }
    if (key !== prevSalaryDeps1.current) {
      prevSalaryDeps1.current = key;
      setRateApplied(false);
    }
  }, [initialLoaded, jobType, experienceLevel, companyPremiumPercent]);

  useEffect(() => {
    if (!initialLoaded) return;
    const key = `${jobType2}|${experienceLevel2}|${companyPremiumPercent}`;
    if (prevSalaryDeps2.current === "") {
      prevSalaryDeps2.current = key;
      return;
    }
    if (key !== prevSalaryDeps2.current) {
      prevSalaryDeps2.current = key;
      setRateApplied2(false);
    }
  }, [initialLoaded, jobType2, experienceLevel2, companyPremiumPercent]);

  useEffect(() => {
    if (!initialLoaded) return;
    const key = `${jobType3}|${experienceLevel3}|${companyPremiumPercent}`;
    if (prevSalaryDeps3.current === "") {
      prevSalaryDeps3.current = key;
      return;
    }
    if (key !== prevSalaryDeps3.current) {
      prevSalaryDeps3.current = key;
      setRateApplied3(false);
    }
  }, [initialLoaded, jobType3, experienceLevel3, companyPremiumPercent]);

  // Fetch agreement periods for salary lookup
  const { data: agreementData } = useQuery({
    queryKey: ["agreement-lookup"],
    queryFn: async () => {
      const [posRes, sgRes, apRes] = await Promise.all([
        supabase.from("positions").select("id, label_en"),
        supabase.from("skill_groups").select("id, label_en"),
        supabase.from("agreement_periods").select("position_id, skill_group_id, hourly_rate, monthly_rate, period_label, age_group"),
      ]);
      return {
        positions: posRes.data ?? [],
        skillGroups: sgRes.data ?? [],
        agreements: apRes.data ?? [],
      };
    },
  });

  // Derive age group from employee birthday and employment start date
  const getDerivedAgeGroup = (): string => {
    if (!birthday) return "19_plus";
    // Determine employment start date based on employment form
    let startDate: Date | undefined;
    if (employmentForm === "seasonal") startDate = seasonalFromDate;
    else if (employmentForm === "fixed_term") startDate = fixedTermFromDate;
    else if (employmentForm === "age69") startDate = age69FromDate;
    else if (employmentForm === "permanent") startDate = permanentFromDate;
    else if (employmentForm === "probationary") startDate = probationFromDate;
    if (!startDate) startDate = new Date(); // fallback to today

    let age = startDate.getFullYear() - birthday.getFullYear();
    const monthDiff = startDate.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && startDate.getDate() < birthday.getDate())) {
      age--;
    }
    if (age <= 16) return "16";
    if (age === 17) return "17";
    if (age === 18) return "18";
    return "19_plus";
  };

  // Derive period label from season year or employment start date
  const getDerivedPeriodLabel = (): string => {
    if (schedulingData.seasonYear) {
      const sy = Number(schedulingData.seasonYear);
      return `${sy}/${sy + 1}`;
    }
    return "2025/2026"; // fallback
  };

  // Look up official rate for a specific job type and experience level
  const getOfficialRateForJob = (jt: string, exp: string) => {
    if (!agreementData || !jt || !exp) return null;
    const jobEnglish = jt.split(" / ")[0].trim();
    const pos = agreementData.positions.find(p => p.label_en === jobEnglish);
    const expPrefix = exp.split(" / ")[0].split("(")[0].trim();
    const sg = agreementData.skillGroups.find(s => s.label_en.split("(")[0].trim().toLowerCase() === expPrefix.toLowerCase());
    if (!pos || !sg) return null;

    const ageGroup = getDerivedAgeGroup();
    const periodLabel = getDerivedPeriodLabel();

    let ap = agreementData.agreements.find(a =>
      a.position_id === pos.id && a.skill_group_id === sg.id && a.age_group === ageGroup && a.period_label === periodLabel
    );
    if (!ap) {
      ap = agreementData.agreements.find(a =>
        a.position_id === pos.id && a.skill_group_id === sg.id && a.age_group === ageGroup
      );
    }
    if (!ap && ageGroup !== "19_plus") {
      ap = agreementData.agreements.find(a =>
        a.position_id === pos.id && a.skill_group_id === sg.id && a.age_group === "19_plus" && a.period_label === periodLabel
      );
    }
    if (!ap) return null;
    return {
      hourly: Number(ap.hourly_rate),
      monthly: Number(ap.monthly_rate),
      ageGroup: ap.age_group ?? ageGroup,
      periodLabel: ap.period_label ?? periodLabel,
    };
  };

  // Rates for each active job type
  const officialRate = getOfficialRateForJob(jobType, experienceLevel);
  const officialRate2 = (numberOfJobTypes === "2" || numberOfJobTypes === "3") ? getOfficialRateForJob(jobType2, experienceLevel2) : null;
  const officialRate3 = numberOfJobTypes === "3" ? getOfficialRateForJob(jobType3, experienceLevel3) : null;

  // Apply premium to an official rate
  const applyPremium = (rate: number): number => {
    const premium = Math.max(0, parseFloat(companyPremiumPercent) || 0);
    return parseFloat((rate * (1 + premium / 100)).toFixed(2));
  };

  const handleApplyRate = (jobIndex: 1 | 2 | 3) => {
    const rate = jobIndex === 1 ? officialRate : jobIndex === 2 ? officialRate2 : officialRate3;
    if (!rate) return;
    const adjustedHourly = applyPremium(rate.hourly);
    const adjustedMonthly = rate.monthly > 0 ? applyPremium(rate.monthly) : 0;
    if (jobIndex === 1) {
      setHourlyBasic(adjustedHourly.toString());
      setMonthlyBasic(adjustedMonthly > 0 ? adjustedMonthly.toString() : "");
      setRateApplied(true);
    } else if (jobIndex === 2) {
      setHourlyBasic2(adjustedHourly.toString());
      setMonthlyBasic2(adjustedMonthly > 0 ? adjustedMonthly.toString() : "");
      setRateApplied2(true);
    } else {
      setHourlyBasic3(adjustedHourly.toString());
      setMonthlyBasic3(adjustedMonthly > 0 ? adjustedMonthly.toString() : "");
      setRateApplied3(true);
    }
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
    mainDuties, jobType, experienceLevel, numberOfJobTypes, jobType2, experienceLevel2, jobType3, experienceLevel3, postingLocation, workplaceVaries, mainWorkplace, stationing,
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
    sinkEnabled, sinkConfirmed,
    age69FromDate: age69FromDate?.toISOString() ?? null,
    age69UntilDate: age69UntilDate?.toISOString() ?? null,
    workingTime, partTimePercent, annualLeaveDays,
    salaryType, hourlyBasic, hourlyPremium, monthlyBasic, monthlyPremium, rateApplied,
    hourlyBasic2, hourlyPremium2, monthlyBasic2, monthlyPremium2, rateApplied2,
    hourlyBasic3, hourlyPremium3, monthlyBasic3, monthlyPremium3, rateApplied3,
    companyPremiumPercent, contractLanguage,
    pieceWorkPay, otherSalaryBenefits, paymentMethod,
    trainingSkotselskolan, trainingSYN, trainingOtherEnabled, trainingOtherText,
    miscellaneousText,
     salaryDeductions,
     deductionsConfirmed,
    schedulingData: schedulingData as unknown as Record<string, any>,
    lastActiveSection: activeSection,
  }), [
    firstName, middleName, lastName, preferredName,
    address, address2, zipCode, city, stateProvince, country,
    birthday, countryOfBirth, citizenship, mobile, email,
    emergencyFirstName, emergencyLastName, emergencyMobile,
    mainDuties, jobType, experienceLevel, numberOfJobTypes, jobType2, experienceLevel2, jobType3, experienceLevel3, postingLocation, workplaceVaries, mainWorkplace, stationing,
    employmentForm, permanentFromDate, probationFromDate, probationUntilDate,
    fixedTermFromDate, fixedTermUntilDate, tempReplacementFromDate, tempReplacementPosition, tempReplacementNoLaterThan,
    seasonalFromDate, seasonalEndAround, sinkEnabled, sinkConfirmed, age69FromDate, age69UntilDate,
    workingTime, partTimePercent, annualLeaveDays,
    salaryType, hourlyBasic, hourlyPremium, monthlyBasic, monthlyPremium, rateApplied,
    hourlyBasic2, hourlyPremium2, monthlyBasic2, monthlyPremium2, rateApplied2,
    hourlyBasic3, hourlyPremium3, monthlyBasic3, monthlyPremium3, rateApplied3,
    companyPremiumPercent, contractLanguage,
    pieceWorkPay, otherSalaryBenefits, paymentMethod,
    trainingSkotselskolan, trainingSYN, trainingOtherEnabled, trainingOtherText,
    miscellaneousText, salaryDeductions, deductionsConfirmed, schedulingData, activeSection,
  ]);

  // Auto-save every 1 second after changes — but NEVER overwrite contracts already sent for signing
  useEffect(() => {
    if (!contractId) return;
    // Block auto-save once the contract has been sent for signing to preserve data integrity
    if (signingStatus && signingStatus !== "not_sent") return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const { error } = await supabase
          .from("contracts")
          .update({ form_data: getFormData() })
          .eq("id", contractId)
          .eq("signing_status", "not_sent"); // Safety: only update if still not sent
        if (error) throw error;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [getFormData, contractId, signingStatus]);

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
  if (!numberOfJobTypes) section3Missing.push("Number of Job Types");
  if (numberOfJobTypes && !jobType) section3Missing.push("Job Type");
  if (numberOfJobTypes && !experienceLevel) section3Missing.push("Experience Level");
  if ((numberOfJobTypes === "2" || numberOfJobTypes === "3") && !jobType2) section3Missing.push("Job Type 2");
  if ((numberOfJobTypes === "2" || numberOfJobTypes === "3") && !experienceLevel2) section3Missing.push("Experience Level 2");
  if (numberOfJobTypes === "3" && !jobType3) section3Missing.push("Job Type 3");
  if (numberOfJobTypes === "3" && !experienceLevel3) section3Missing.push("Experience Level 3");
  if (!postingLocation) section3Missing.push("Posting Location");
  if (!workplaceVaries) section3Missing.push("Workplace Varies");
  if (workplaceVaries === "no" && !mainWorkplace) section3Missing.push("Main Workplace");
  

  const section5Missing: string[] = [];
  if (employmentForm === "permanent" && !permanentFromDate) section5Missing.push("Permanent Start Date");
  if (employmentForm === "probationary" && (!probationFromDate || !probationUntilDate)) section5Missing.push("Probation Dates");
  if (employmentForm === "fixed_term" && (!fixedTermFromDate || !fixedTermUntilDate)) section5Missing.push("Fixed-Term Dates");
  if (employmentForm === "temporary_replacement" && !tempReplacementFromDate) section5Missing.push("Temp Replacement Start Date");
  if (employmentForm === "seasonal" && !seasonalFromDate) section5Missing.push("Seasonal Start Date");

  // SINK validation: if enabled, seasonal period must be ≤ 6 months
  const sinkPeriodExceeded = useMemo(() => {
    if (!sinkEnabled || employmentForm !== "seasonal") return false;
    if (!seasonalFromDate || !seasonalEndAround) return false;
    // Allow up to exactly 6 calendar months (e.g. March 1 → August 31)
    const months = differenceInMonths(seasonalEndAround, seasonalFromDate);
    if (months > 6) return true;
    if (months === 6 && differenceInDays(seasonalEndAround, seasonalFromDate) > 183) return true;
    return false;
  }, [sinkEnabled, employmentForm, seasonalFromDate, seasonalEndAround]);

  if (sinkPeriodExceeded) section5Missing.push("SINK period exceeds 6 months");

  if (employmentForm === "age69" && (!age69FromDate || !age69UntilDate)) section5Missing.push("Age 69 Dates");

  const section6Missing: string[] = [];
  if (workingTime === "parttime" && !partTimePercent) section6Missing.push("Part Time Percentage");

  const section7Missing: string[] = [];
  if (!annualLeaveDays) section7Missing.push("Annual Leave Days");

  const section8Missing: string[] = [];
  if (!rateApplied) section8Missing.push("Apply Official Rate (Job Type 1)");
  if (salaryType === "hourly" && !hourlyBasic) section8Missing.push("Hourly Basic Rate (Job Type 1)");
  if (salaryType === "monthly" && !monthlyBasic) section8Missing.push("Monthly Basic Rate (Job Type 1)");
  if ((numberOfJobTypes === "2" || numberOfJobTypes === "3") && !rateApplied2) section8Missing.push("Apply Official Rate (Job Type 2)");
  if ((numberOfJobTypes === "2" || numberOfJobTypes === "3") && salaryType === "hourly" && !hourlyBasic2) section8Missing.push("Hourly Basic Rate (Job Type 2)");
  if ((numberOfJobTypes === "2" || numberOfJobTypes === "3") && salaryType === "monthly" && !monthlyBasic2) section8Missing.push("Monthly Basic Rate (Job Type 2)");
  if (numberOfJobTypes === "3" && !rateApplied3) section8Missing.push("Apply Official Rate (Job Type 3)");
  if (numberOfJobTypes === "3" && salaryType === "hourly" && !hourlyBasic3) section8Missing.push("Hourly Basic Rate (Job Type 3)");
  if (numberOfJobTypes === "3" && salaryType === "monthly" && !monthlyBasic3) section8Missing.push("Monthly Basic Rate (Job Type 3)");

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

  // Map activeSection to the relevant validation keys
  const getValidationKeysForSection = (section: string): string[] => {
    switch (section) {
      case "employee": return ["2.1", "2.2", "2.3"];
      case "section-3": return ["3"];
      case "section-5": return ["5"];
      case "section-6": return ["6"];
      case "section-7": return ["7"];
      case "section-8": return ["8"];
      default: return [];
    }
  };

  const getMissingFieldsForSection = (section: string): string[] => {
    const keys = getValidationKeysForSection(section);
    return keys.flatMap(k => sectionWarnings[k] || []);
  };

  // All missing fields across all sections (for final signing gate)
  const allMissingFields = useMemo(() => {
    return Object.entries(sectionWarnings).flatMap(([key, fields]) =>
      fields.map(f => `§${key}: ${f}`)
    );
  }, [
    section21Missing.length, section22Missing.length, section23Missing.length,
    section3Missing.length, section5Missing.length, section6Missing.length,
    section7Missing.length, section8Missing.length
  ]);

  const handleValidatedNext = () => {
    const missing = getMissingFieldsForSection(activeSection);
    if (missing.length > 0) {
      toast.error(`Please complete required fields before proceeding: ${missing.join(", ")}`, {
        duration: 5000,
      });
      return;
    }
    onNext();
  };

  // Dispatch next action based on active section
  const handleCurrentSectionNext = () => {
    if (activeSection === "section-8") {
      // Check if any required rates are not applied
      const needsRate1 = !rateApplied;
      const needsRate2 = (numberOfJobTypes === "2" || numberOfJobTypes === "3") && !rateApplied2;
      const needsRate3 = numberOfJobTypes === "3" && !rateApplied3;
      if ((needsRate1 || needsRate2 || needsRate3) && !showRateWarning) {
        setShowRateWarning(true);
        return;
      }
      setShowRateWarning(false);
      if (!pieceWorkPay && !otherSalaryBenefits && !showSalaryPrompt) {
        setShowSalaryPrompt(true);
        return;
      }
      setShowSalaryPrompt(false);
      onNext();
    } else if (activeSection === "section-12") {
      onNext();
    } else if (activeSection === "section-5" && employmentForm === "seasonal" && !sinkConfirmed) {
      setShowSinkQuestion(true);
      return;
    } else {
      handleValidatedNext();
    }
  };

  const hasSalaryBelowMinimum = (() => {
    if (activeSection !== "section-8") return false;
    const checks = [
      { hb: hourlyBasic, mb: monthlyBasic, rate: officialRate },
      { hb: hourlyBasic2, mb: monthlyBasic2, rate: officialRate2 },
      { hb: hourlyBasic3, mb: monthlyBasic3, rate: officialRate3 },
    ];
    return checks.some(({ hb, mb, rate }) => {
      if (!rate) return false;
      if (salaryType === "hourly" && parseFloat(hb) > 0 && parseFloat(hb) < rate.hourly) return true;
      if (salaryType === "monthly" && parseFloat(mb) > 0 && parseFloat(mb) < rate.monthly) return true;
      return false;
    });
  })();

  const isNextDisabled = activeSection === "section-13"
    ? !deductionsConfirmed
    : (getMissingFieldsForSection(activeSection).length > 0 || hasSalaryBelowMinimum);

  const showNextButton = activeSection !== "section-14" && activeSection !== "section-scheduling";

  const renderLabel = (en: string, sv: string, required = true) => {
    const primary = getFormLabel(en, contractLanguage);
    const display = contractLanguage === "SE" ? sv : `${primary} / ${sv}`;
    return (
      <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {display}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
    );
  };

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
            {contractLanguage === "SE"
              ? `Sektion ${number}: ${titleSv}`
              : contractLanguage === "RO/SE"
              ? `Secțiunea ${number}: ${getFormLabel(titleEn, contractLanguage)} / Sektion ${number}: ${titleSv}`
              : contractLanguage === "TH/SE"
              ? `ส่วนที่ ${number}: ${getFormLabel(titleEn, contractLanguage)} / Sektion ${number}: ${titleSv}`
              : contractLanguage === "UK/SE"
              ? `Розділ ${number}: ${getFormLabel(titleEn, contractLanguage)} / Sektion ${number}: ${titleSv}`
              : `Section ${number}: ${titleEn} / Sektion ${number}: ${titleSv}`}
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

  // Shorthand for bilingual text
  const bl = (en: string, sv: string) => getFormBilingual(en, sv, contractLanguage);

  const progressSteps = [
    { id: "parties", label: bl("Parties", "Parter"), icon: Users, sections: ["employee"] },
    { id: "employment", label: bl("Employment", "Anställning"), icon: Briefcase, sections: ["section-3", "section-4", "section-5", "section-6"] },
    { id: "compensation", label: bl("Compensation", "Kompensation"), icon: DollarSign, sections: ["section-7", "section-8"] },
    { id: "others", label: bl("Others", "Övrigt"), icon: MoreHorizontal, sections: ["section-9", "section-10", "section-11", "section-12", "section-13"] },
    { id: "review", label: bl("Review & Sign", "Granska & Signera"), icon: CheckCircle, sections: ["section-scheduling", "section-14"] },
  ];

  // Determine which progress step is active based on activeSection
  const activeProgressIdx = useMemo(() => {
    for (let i = 0; i < progressSteps.length; i++) {
      if (progressSteps[i].sections.includes(activeSection)) return i;
    }
    return 0;
  }, [activeSection]);

  return (
    <div>
      {/* Sticky progress bar */}
      <Card className="shadow-md sticky top-0 z-20 rounded-b-none border-b-0">
        <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {bl("Employment contract for workers", "Anställningsavtal för arbetare")}
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
              {bl("Exit", "Avsluta")}
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
        {/* Navigation buttons — always visible in sticky header */}
        {activeSection !== "section-scheduling" && (
          <div className="flex justify-between pt-3">
            <Button variant="back" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {bl("Back", "Tillbaka")}
            </Button>
            {showNextButton && (
              <Button className="px-8" onClick={handleCurrentSectionNext} disabled={isNextDisabled}>
                {bl("Next Step", "Nästa")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      </Card>
      <Card className="shadow-md rounded-t-none border-t-0">
      <CardContent className="space-y-5 pt-5">
        {/* === Employee Details sections (activeSection === "employee") === */}
        {activeSection === "employee" && <>{/* Section 1: Employer Information */}
        <Collapsible open={section1Open} onOpenChange={setSection1Open}>
          <SectionHeader
              number="1"
              titleEn="Employer Information"
              titleSv="Arbetsgivarinformation"
              open={section1Open}
              onToggle={() => setSection1Open(!section1Open)}
            />
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
          
            <SectionHeader
              number="2.1"
              titleEn="Name and Address Information"
              titleSv="Namn och Adressinformation"
              open={section21Open}
              onToggle={() => setSection21Open(!section21Open)}
            />
          
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
                     <SelectValue placeholder={bl("Select country...", "Välj land...")} />
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
          
            <SectionHeader
              number="2.2"
              titleEn="Birth and Contact Information"
              titleSv="Födelse- och Kontaktinformation"
              open={section22Open}
              onToggle={() => setSection22Open(!section22Open)}
            />
          
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
                      {birthday ? format(birthday, "yyyy-MM-dd") : bl("Pick a date", "Välj datum")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthday}
                      defaultMonth={birthday || undefined}
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
                     <SelectValue placeholder={bl("Select country...", "Välj land...")} />
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
                    <SelectValue placeholder={bl("Select country...", "Välj land...")} />
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
          
            <SectionHeader
              number="2.3"
              titleEn="Emergency Contact Information"
              titleSv="Information om Närmast Anhörig"
              open={section23Open}
              onToggle={() => setSection23Open(!section23Open)}
            />
          
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

        </>}

        {/* === Employment Section 3 (activeSection === "employment-3") === */}
        {activeSection === "section-3" && <>
        {/* Section 3: Employment Details */}
        <Collapsible open={section3Open} onOpenChange={setSection3Open}>
          
            <SectionHeader
              number="3"
              titleEn="Employment Details"
              titleSv="Anställningsuppgifter"
              open={section3Open}
              onToggle={() => setSection3Open(!section3Open)}
            />
          
           <CollapsibleContent>
            <div className="pt-4 pb-2 space-y-4 px-2">
              {/* Employed as / main duties */}
              <div className="space-y-1.5">
                {renderLabel("Employed as / Main Duties", "Anställd som / Huvudsakliga arbetsuppgifter")}
                {renderField(mainDuties, setMainDuties)}
              </div>

              {/* How many job types? — GATEKEEPER */}
              <div className="space-y-1.5">
                {renderLabel("Number of Job Types", "Antal befattningstyper")}
                <p className="text-xs text-muted-foreground -mt-1">
                  {bl("How many different job types will the employee have? Select to continue.", "Hur många olika befattningstyper ska den anställde ha? Välj för att fortsätta.")}
                </p>
                {!numberOfJobTypes && (
                   <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {bl("Required – please select the number of job types", "Obligatoriskt – välj antal befattningstyper")}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Select value={numberOfJobTypes} onValueChange={(v) => {
                    const val = v as "" | "1" | "2" | "3";
                    setNumberOfJobTypes(val);
                    if (val === "1") { setJobType2(""); setExperienceLevel2(""); setJobType3(""); setExperienceLevel3(""); }
                    if (val === "2") { setJobType3(""); setExperienceLevel3(""); }
                  }}>
                    <SelectTrigger className={cn("h-11 text-sm font-medium w-full", !numberOfJobTypes && "border-destructive ring-2 ring-destructive/40 bg-destructive/5 shadow-sm shadow-destructive/10")}>
                      <SelectValue placeholder={`⚠ ${bl("Select number of job types...", "Välj antal...")}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{bl("1 – Only one", "1 – Bara en")}</SelectItem>
                      <SelectItem value="2">{bl("2 – Two job types", "2 – Två befattningstyper")}</SelectItem>
                      <SelectItem value="3">{bl("3 – Three job types", "3 – Tre befattningstyper")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {numberOfJobTypes && (
                    <button
                      type="button"
                      onClick={() => {
                        setNumberOfJobTypes("");
                        setJobType(""); setExperienceLevel("");
                        setJobType2(""); setExperienceLevel2("");
                        setJobType3(""); setExperienceLevel3("");
                      }}
                      className="text-xs text-destructive hover:text-destructive/80 underline whitespace-nowrap"
                    >
                      {bl("Reset", "Återställ")}
                    </button>
                  )}
                </div>
              </div>

              {/* Job type inputs — only shown after numberOfJobTypes is selected */}
              {numberOfJobTypes !== "" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Job Type 1 */}
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-sm font-semibold text-muted-foreground">{bl("Job Type 1", "Befattningstyp 1")}</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1.5">
                        {renderLabel("Job Type 1", "Befattningstyp 1")}
                        {!jobType && (
                          <p className="text-xs text-destructive font-medium flex items-center gap-1">
                             <AlertTriangle className="w-3 h-3" /> {bl("Required", "Obligatoriskt")}
                          </p>
                        )}
                        <Select value={jobType} onValueChange={setJobType} required>
                          <SelectTrigger className={cn("h-11 text-sm font-medium", !jobType && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
                            <SelectValue placeholder={bl("Pick the job type...", "Välj arbetsuppgift...")} />
                          </SelectTrigger>
                          <SelectContent>
                            {jobTypeGroups.map((group) => (
                              <SelectGroup key={group.group}>
                                <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  {group.group}
                                </SelectLabel>
                                {group.items.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        {renderLabel("Experience Level 1", "Erfarenhetsnivå 1")}
                        {jobType && !experienceLevel && (
                          <p className="text-xs text-destructive font-medium flex items-center gap-1">
                             <AlertTriangle className="w-3 h-3" /> {bl("Required", "Obligatoriskt")}
                          </p>
                        )}
                        <Select value={experienceLevel} onValueChange={setExperienceLevel} required>
                          <SelectTrigger className={cn("h-11 text-sm font-medium", jobType && !experienceLevel && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
                            <SelectValue placeholder={bl("Choose experience level...", "Välj erfarenhetsnivå...")} />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {getExperienceLevelLabel(level, contractLanguage)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Job Type 2 */}
                  {(numberOfJobTypes === "2" || numberOfJobTypes === "3") && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-sm font-semibold text-muted-foreground">{bl("Job Type 2", "Befattningstyp 2")}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1.5">
                          {renderLabel("Job Type 2", "Befattningstyp 2")}
                          <Select value={jobType2} onValueChange={setJobType2}>
                            <SelectTrigger className={cn("h-11 text-sm font-medium", !jobType2 && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
                              <SelectValue placeholder={bl("Pick job type 2...", "Välj befattningstyp 2...")} />
                            </SelectTrigger>
                            <SelectContent>
                              {jobTypeGroups.map((group) => (
                                <SelectGroup key={group.group}>
                                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {group.group}
                                  </SelectLabel>
                                  {group.items.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                          {jobType2 && jobType2 === jobType && (
                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" /> {bl("Duplicate: same as Job Type 1 – not necessary", "Dublett: samma som Befattningstyp 1 – inte nödvändigt")}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {renderLabel("Experience Level 2", "Erfarenhetsnivå 2")}
                          {jobType2 && !experienceLevel2 && (
                            <p className="text-xs text-destructive font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {bl("Required", "Obligatoriskt")}
                            </p>
                          )}
                          <Select value={experienceLevel2} onValueChange={setExperienceLevel2}>
                            <SelectTrigger className={cn("h-11 text-sm font-medium", jobType2 && !experienceLevel2 && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
                              <SelectValue placeholder={bl("Choose experience level...", "Välj erfarenhetsnivå...")} />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPERIENCE_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {getExperienceLevelLabel(level, contractLanguage)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Job Type 3 */}
                  {numberOfJobTypes === "3" && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-sm font-semibold text-muted-foreground">{bl("Job Type 3", "Befattningstyp 3")}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1.5">
                          {renderLabel("Job Type 3", "Befattningstyp 3")}
                          <Select value={jobType3} onValueChange={setJobType3}>
                            <SelectTrigger className={cn("h-11 text-sm font-medium", !jobType3 && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
                              <SelectValue placeholder={bl("Pick job type 3...", "Välj befattningstyp 3...")} />
                            </SelectTrigger>
                            <SelectContent>
                              {jobTypeGroups.map((group) => (
                                <SelectGroup key={group.group}>
                                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {group.group}
                                  </SelectLabel>
                                  {group.items.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                          {jobType3 && (jobType3 === jobType || jobType3 === jobType2) && (
                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" /> {bl(`Duplicate: same as ${jobType3 === jobType ? "Job Type 1" : "Job Type 2"} – not necessary`, `Dublett: samma som ${jobType3 === jobType ? "Befattningstyp 1" : "Befattningstyp 2"} – inte nödvändigt`)}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {renderLabel("Experience Level 3", "Erfarenhetsnivå 3")}
                          {jobType3 && !experienceLevel3 && (
                            <p className="text-xs text-destructive font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {bl("Required", "Obligatoriskt")}
                            </p>
                          )}
                          <Select value={experienceLevel3} onValueChange={setExperienceLevel3}>
                            <SelectTrigger className={cn("h-11 text-sm font-medium", jobType3 && !experienceLevel3 && "border-destructive ring-1 ring-destructive/30 bg-destructive/5")}>
                              <SelectValue placeholder={bl("Choose experience level...", "Välj erfarenhetsnivå...")} />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPERIENCE_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {getExperienceLevelLabel(level, contractLanguage)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Posting location */}
              <div className="space-y-1.5">
                {renderLabel("Posting Location", "Stationeringsort")}
                <p className="text-xs text-muted-foreground -mt-1">
                  {bl("Used, for example, to calculate travel time compensation", "Används till exempel för att beräkna restidsersättning")}
                </p>
                {renderField(postingLocation, setPostingLocation)}
              </div>

              {/* Workplace varies */}
              <div className="space-y-2">
                {renderLabel("Workplace Varies Between Different Days", "Arbetsplatsen varierar mellan olika dagar")}
                <p className="text-xs text-muted-foreground -mt-1">
                  {bl("Workplace (place where the work is to be performed) varies between different days", "Arbetsplats (plats där arbetet ska utföras) varierar mellan olika dagar")}
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
                    <span className="text-sm font-medium">{bl("Yes", "Ja")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workplaceVaries"
                      checked={workplaceVaries === "no"}
                      onChange={() => setWorkplaceVaries("no")}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm font-medium">{bl("No", "Nej")}</span>
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
                      <span className="font-semibold underline">{bl("The main rule", "Huvudregeln")}:</span>{" "}
                      {bl("The place of employment is the place where the employee performs the main part of his work.", "Stationeringsorten är den plats där arbetstagaren utför huvuddelen av sitt arbete.")}
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
                      <span className="font-semibold underline">{bl("The alternative rule", "Alternativregeln")}:</span>{" "}
                      {bl("If the work is performed while moving or at workplaces that are constantly changing, the place of work is instead the place where the employee picks up and leaves work materials or prepares and finishes his work tasks.", "Om arbetet utförs under förflyttning eller på arbetsplatser som ständigt växlar, är stationeringsorten i stället den plats där arbetstagaren hämtar och lämnar arbetsmaterial eller förbereder och avslutar sina arbetsuppgifter.")}
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
                      <span className="font-semibold underline">{bl("The exception rule", "Undantagsregeln")}:</span>{" "}
                      {bl("If the work takes place for a limited time at each location, which applies to certain works in the building and construction industry and similar industries, the residence is a place of employment.", "Om arbetet pågår under begränsad tid på varje plats, vilket gäller för vissa arbeten inom byggnads- och anläggningsbranschen och liknande branscher, är bostaden stationeringsort.")}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Employment Sections 4, 5, 6 (activeSection === "employment-456") === */}
        {activeSection === "section-4" && <>
        {/* Section 4: Collective Agreement */}
        <Collapsible open={section4Open} onOpenChange={setSection4Open}>
          
            <SectionHeader
              number="4"
              titleEn="Collective Agreement"
              titleSv="Kollektivavtal"
              open={section4Open}
              onToggle={() => setSection4Open(!section4Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2">
              <div className="rounded-xl border border-border bg-muted/20 p-5">
                <p className="text-sm font-bold mb-1">{bl("Collective agreement", "Kollektivavtal")}</p>
                <p className="text-sm text-muted-foreground">
                  {bl("The employment arrangement is covered by the collective agreement known as Skogsavtalet [Forest Agreement] between the GS trade union and Gröna arbetsgivare.", "Anställningen omfattas av kollektivavtalet Skogsavtalet mellan fackförbundet GS och Gröna arbetsgivare.")}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Section 5 (activeSection === "section-5") === */}
        {activeSection === "section-5" && <>
        {/* Section 5: Form of Employment */}
        <Collapsible open={section5Open} onOpenChange={setSection5Open}>
          
            <SectionHeader
              number="5"
              titleEn="Form of Employment"
              titleSv="Anställningsform"
              open={section5Open}
              onToggle={() => setSection5Open(!section5Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-3">
              {/* 1. Permanent Employment */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "permanent" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => handleEmploymentFormChange("permanent")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "permanent" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "permanent" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">{bl("Permanent employment from", "Tillsvidareanställning från")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium ml-auto", !permanentFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {permanentFromDate ? format(permanentFromDate, "yyyy-MM-dd") : bl("Select date", "Välj datum")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={permanentFromDate} defaultMonth={permanentFromDate || undefined} onSelect={setPermanentFromDate} initialFocus className="p-3 pointer-events-auto" />
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
                onClick={() => handleEmploymentFormChange("probationary")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "probationary" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "probationary" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">{bl("Probationary period (max. 6 months) from", "Provanställning (max 6 mån) från")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !probationFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {probationFromDate ? format(probationFromDate, "yyyy-MM-dd") : bl("from", "från")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={probationFromDate} defaultMonth={probationFromDate || undefined} onSelect={setProbationFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">{bl("until", "till")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !probationUntilDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {probationUntilDate ? format(probationUntilDate, "yyyy-MM-dd") : bl("until", "till")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={probationUntilDate} defaultMonth={probationUntilDate || undefined} onSelect={setProbationUntilDate} initialFocus className="p-3 pointer-events-auto" />
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
                onClick={() => handleEmploymentFormChange("fixed_term")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "fixed_term" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "fixed_term" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">{bl("General fixed-term employment from", "Allmän visstidsanställning från")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !fixedTermFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fixedTermFromDate ? format(fixedTermFromDate, "yyyy-MM-dd") : bl("from", "från")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={fixedTermFromDate} defaultMonth={fixedTermFromDate || undefined} onSelect={setFixedTermFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">{bl("until", "till")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !fixedTermUntilDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fixedTermUntilDate ? format(fixedTermUntilDate, "yyyy-MM-dd") : bl("until", "till")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={fixedTermUntilDate} defaultMonth={fixedTermUntilDate || undefined} onSelect={setFixedTermUntilDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                   <span className="text-[10px] text-muted-foreground align-super">{bl("3) and 4)", "3) och 4)")}</span>
                 </div>
                <p className="text-xs text-muted-foreground mt-2 ml-8">
                   {bl("See also annex for repeated periods of employment on a general fixed-term basis.", "Se även bilaga för upprepade perioder av allmän visstidsanställning.")}
                </p>
              </div>

              {/* 4. Temporary Replacement Employment */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "temporary_replacement" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => handleEmploymentFormChange("temporary_replacement")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "temporary_replacement" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "temporary_replacement" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">{bl("Temporary replacement employment from", "Vikariat från")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !tempReplacementFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempReplacementFromDate ? format(tempReplacementFromDate, "yyyy-MM-dd") : bl("from", "från")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={tempReplacementFromDate} defaultMonth={tempReplacementFromDate || undefined} onSelect={setTempReplacementFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                {employmentForm === "temporary_replacement" && (
                  <div className="mt-3 ml-8 space-y-2">
                     <p className="text-xs text-muted-foreground">
                       {bl("The employment ends when the holder of the regular position returns to work. But no later than:", "Anställningen upphör när ordinarie befattningshavare återgår i tjänst. Dock senast:")}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="space-y-1">
                         <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">{bl("Position", "Befattning")}</label>
                         <Input value={tempReplacementPosition} onChange={(e) => setTempReplacementPosition(e.target.value)} className="h-9 text-sm w-48" placeholder={bl("Position", "Befattning") + "..."} onClick={(e) => e.stopPropagation()} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">{bl("No later than", "Dock senast")}</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !tempReplacementNoLaterThan && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {tempReplacementNoLaterThan ? format(tempReplacementNoLaterThan, "yyyy-MM-dd") : bl("Select date", "Välj datum")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={tempReplacementNoLaterThan} defaultMonth={tempReplacementNoLaterThan || undefined} onSelect={setTempReplacementNoLaterThan} initialFocus className="p-3 pointer-events-auto" />
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
                onClick={() => handleEmploymentFormChange("seasonal")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "seasonal" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "seasonal" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">{bl("Seasonal employment from", "Säsongsanställning från")}</span>
                  <div className={cn("ml-auto flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-500", sinkHighlight && "ring-2 ring-amber-400 bg-amber-50")} onClick={(e) => e.stopPropagation()}>
                    <label htmlFor="sink-toggle" className={cn("text-xs font-bold tracking-wide cursor-pointer select-none", sinkHighlight ? "text-amber-700" : "text-muted-foreground")}>SINK</label>
                    <Switch
                      id="sink-toggle"
                      checked={sinkEnabled}
                      onCheckedChange={(v) => {
                        setSinkEnabled(v);
                        setSinkConfirmed(false);
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-2 pl-8">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !seasonalFromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {seasonalFromDate ? format(seasonalFromDate, "yyyy-MM-dd") : bl("from", "från")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={seasonalFromDate} onSelect={setSeasonalFromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">{bl("The season is expected to end around", "Säsongen förväntas sluta omkring")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !seasonalEndAround && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {seasonalEndAround ? format(seasonalEndAround, "yyyy-MM-dd") : bl("end around", "slutar omkring")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={seasonalEndAround} onSelect={setSeasonalEndAround} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] text-muted-foreground align-super">3)</span>
                </div>
                {/* SINK warning */}
                {sinkPeriodExceeded && employmentForm === "seasonal" && (
                  <div className="mt-3 ml-8 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                       <p className="font-semibold text-destructive">
                         {bl("SINK: The period exceeds 6 months", "SINK: Perioden överstiger 6 månader")}
                       </p>
                       <p className="text-muted-foreground text-xs mt-1">
                         {bl("When SINK taxation applies, the seasonal employment period must not exceed 6 months. Please adjust the start or end date.", "Vid SINK-beskattning får säsongsanställningen inte överstiga 6 månader. Justera start- eller slutdatum.")}
                       </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. When the employee has reached the age of 69 */}
              <div
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  employmentForm === "age69" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => handleEmploymentFormChange("age69")}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", employmentForm === "age69" ? "border-primary" : "border-muted-foreground/40")}>
                    {employmentForm === "age69" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">{bl("When the employee has reached the age of 69 from", "När den anställde har fyllt 69 år från")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !age69FromDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {age69FromDate ? format(age69FromDate, "yyyy-MM-dd") : bl("from", "från")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={age69FromDate} onSelect={setAge69FromDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">{bl("until", "till")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-9 text-sm font-medium", !age69UntilDate && "text-muted-foreground")} onClick={(e) => e.stopPropagation()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {age69UntilDate ? format(age69UntilDate, "yyyy-MM-dd") : bl("until", "till")}
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

        {/* SINK consideration question */}
        {showSinkQuestion && employmentForm === "seasonal" && (
          <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-amber-800">
                {bl(
                  "Have you considered whether this is a SINK tax employment or not?",
                  "Har du övervägt om detta är en SINK-anställning eller inte?"
                )}
              </p>
            </div>
            <div className="flex gap-3 ml-8">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setSinkConfirmed(true);
                  setShowSinkQuestion(false);
                  setSinkHighlight(false);
                  onNext();
                }}
              >
                {bl("Yes, I have considered", "Ja, jag har övervägt")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSinkQuestion(false);
                  setSinkHighlight(true);
                  setTimeout(() => setSinkHighlight(false), 4000);
                }}
              >
                {bl("No, I want to check", "Nej, jag vill kontrollera")}
              </Button>
            </div>
          </div>
        )}

        </>}

        {/* === Section 6 (activeSection === "section-6") === */}
        {activeSection === "section-6" && <>
        {/* Section 6: Working Time & Organisation */}
        <Collapsible open={section6Open} onOpenChange={setSection6Open}>
          
            <SectionHeader
              number="6"
              titleEn="Working Time & Organisation"
              titleSv="Arbetstid och arbetstidens förläggning"
              open={section6Open}
              onToggle={() => setSection6Open(!section6Open)}
            />
          
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
                  {bl("Full time 38/40 hours per week (excl. public holidays)", "Heltid 38/40 timmar per vecka (exkl. helgdagar)")}
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
                    {bl("Part time", "Deltid")}
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
                         {bl("per cent of full time", "procent av heltid")}
                       </span>
                     </div>
                   ) : (
                     <span className="text-xs text-muted-foreground">
                       {bl("per cent of full time", "procent av heltid")}
                     </span>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Section 7: Compensation (activeSection === "section-7") === */}
        {activeSection === "section-7" && <>
        {/* Section 7: Holidays */}
        <Collapsible open={section7Open} onOpenChange={setSection7Open}>
          
            <SectionHeader
              number="7"
              titleEn="Holidays"
              titleSv="Semester"
              open={section7Open}
              onToggle={() => setSection7Open(!section7Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">🌴</span>
                    {bl("Holiday Entitlement", "Semesterrätt")}
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

        </>}

        {/* === Section 8: Salary (activeSection === "section-8") === */}
        {activeSection === "section-8" && <>
        <Collapsible open={section8Open} onOpenChange={setSection8Open}>
          
            <SectionHeader
              number="8"
              titleEn="Salary"
              titleSv="Lön"
              open={section8Open}
              onToggle={() => setSection8Open(!section8Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-5">

              {/* Company Premium Setting */}
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                       <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                         {bl("Company Premium", "Företagspremie")}
                       </p>
                       <p className="text-[10px] text-muted-foreground">
                         {bl("Percentage above the official Skogsavtalet rate", "Procentuellt påslag ovanpå officiella Skogsavtalets lön")}
                       </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-11">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={companyPremiumPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCompanyPremiumPercent(isNaN(val) || val < 0 ? "0" : e.target.value);
                      }}
                      className="h-9 w-24 text-sm font-medium"
                      placeholder="0"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">%</span>
                    {parseFloat(companyPremiumPercent) > 0 && (
                      <span className="text-xs text-primary font-medium">
                        +{companyPremiumPercent}% {bl("above official rate", "över officiell taxa")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Official Rate Lookup Cards — one per job type */}
              {[
                { idx: 1 as const, jt: jobType, exp: experienceLevel, rate: officialRate, applied: rateApplied },
                ...(numberOfJobTypes === "2" || numberOfJobTypes === "3" ? [{ idx: 2 as const, jt: jobType2, exp: experienceLevel2, rate: officialRate2, applied: rateApplied2 }] : []),
                ...(numberOfJobTypes === "3" ? [{ idx: 3 as const, jt: jobType3, exp: experienceLevel3, rate: officialRate3, applied: rateApplied3 }] : []),
              ].map(({ idx, jt, exp, rate, applied }) => (
                <Card key={idx} className={cn(
                  "border-2 shadow-sm",
                  rate ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                             {bl(`Job Type ${idx}: Official Rate`, `Befattningstyp ${idx}: Officiell lön`)}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">
                            {jt || bl("Not selected", "Ej vald")}
                          </p>
                          {rate ? (
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <p className="text-lg font-bold text-foreground">
                                {applyPremium(rate.hourly).toFixed(2)} SEK/hr
                              </p>
                              {parseFloat(companyPremiumPercent) > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({rate.hourly.toFixed(2)} + {companyPremiumPercent}%)
                                </span>
                              )}
                            </div>
                          ) : (
                             <p className="text-sm text-muted-foreground">
                               {!jt || !exp
                                 ? bl("Select Job Type and Experience Level in Section 3 first", "Välj befattningstyp och erfarenhetsnivå i Sektion 3 först")
                                 : !birthday
                                   ? bl("Set employee birth date in Section 2 first", "Ange anställds födelsedatum i Sektion 2 först")
                                   : bl("No matching rate found in agreement data", "Ingen matchande lön hittades i avtalsdata")}
                             </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleApplyRate(idx)}
                        disabled={!rate || applied}
                        className="px-6"
                      >
                        {applied ? `${bl("Applied", "Applicerad")} ✓` : bl("Apply Rate", "Tillämpa lön")}
                      </Button>
                    </div>
                    {rate && (
                      <div className="mt-2 ml-[52px] space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Monthly: {rate.monthly > 0 ? `${applyPremium(rate.monthly).toLocaleString()} SEK/month${parseFloat(companyPremiumPercent) > 0 ? ` (${rate.monthly.toLocaleString()} + ${companyPremiumPercent}%)` : ''}` : "N/A (hourly only)"}
                        </p>
                        <p className="text-xs font-medium text-primary/80">
                          Rate for: Age {rate.ageGroup === "19_plus" ? "19+" : rate.ageGroup} · Period {rate.periodLabel}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Salary Type Selection */}
              <div className="flex gap-4">
                <div
                  className={cn(
                    "flex-1 rounded-lg border-2 p-3 cursor-pointer transition-colors flex items-center gap-3",
                    salaryType === "hourly" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  )}
                  onClick={() => setSalaryType("hourly")}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", salaryType === "hourly" ? "border-primary" : "border-muted-foreground/40")}>
                    {salaryType === "hourly" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">{bl("Hourly Pay", "Timlön")} **</span>
                </div>
                <div
                  className={cn(
                    "flex-1 rounded-lg border-2 p-3 cursor-pointer transition-colors flex items-center gap-3",
                    salaryType === "monthly" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  )}
                  onClick={() => setSalaryType("monthly")}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", salaryType === "monthly" ? "border-primary" : "border-muted-foreground/40")}>
                    {salaryType === "monthly" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">{bl("Monthly Salary", "Månadslön")} **</span>
                </div>
              </div>

              {/* Per-job-type salary inputs */}
              {[
                { idx: 1, jt: jobType, hb: hourlyBasic, setHb: setHourlyBasic, hp: hourlyPremium, setHp: setHourlyPremium, mb: monthlyBasic, setMb: setMonthlyBasic, mp: monthlyPremium, setMp: setMonthlyPremium },
                ...((numberOfJobTypes === "2" || numberOfJobTypes === "3") ? [{ idx: 2, jt: jobType2, hb: hourlyBasic2, setHb: setHourlyBasic2, hp: hourlyPremium2, setHp: setHourlyPremium2, mb: monthlyBasic2, setMb: setMonthlyBasic2, mp: monthlyPremium2, setMp: setMonthlyPremium2 }] : []),
                ...(numberOfJobTypes === "3" ? [{ idx: 3, jt: jobType3, hb: hourlyBasic3, setHb: setHourlyBasic3, hp: hourlyPremium3, setHp: setHourlyPremium3, mb: monthlyBasic3, setMb: setMonthlyBasic3, mp: monthlyPremium3, setMp: setMonthlyPremium3 }] : []),
              ].map(({ idx, jt, hb, setHb, hp, setHp, mb, setMb, mp, setMp }) => {
                const rate = idx === 1 ? officialRate : idx === 2 ? officialRate2 : officialRate3;
                const hbNum = parseFloat(hb);
                const mbNum = parseFloat(mb);
                const showHourlyWarn = salaryType === "hourly" && rate && hbNum > 0 && hbNum < rate.hourly;
                const showMonthlyWarn = salaryType === "monthly" && rate && mbNum > 0 && mbNum < rate.monthly;

                const getSalaryWarning = (type: "hourly" | "monthly", value: string, min: number) => {
                  const key = type === "hourly" ? "salary_below_min_hourly" : "salary_below_min_monthly";
                  const unitSv = type === "hourly" ? "tim" : "mån";
                  const sv = `Den angivna grundlönen (${value} SEK/${unitSv}) understiger kollektivavtalets minimibelopp (${min} SEK/${unitSv}).`;
                  if (contractLanguage === "SE") return sv;
                  // Get primary language translation
                  const translated = getFormLabel(key, contractLanguage);
                  const primary = translated !== key
                    ? translated.replace("{value}", value).replace("{min}", min.toString())
                    : type === "hourly"
                      ? `The entered basic pay (${value} SEK/hr) is below the collective agreement minimum (${min} SEK/hr).`
                      : `The entered basic salary (${value} SEK/mån) is below the collective agreement minimum (${min} SEK/mån).`;
                  return `${primary} / ${sv}`;
                };

                return (
                <div key={idx} className="rounded-xl border border-border p-4 space-y-3">
                   <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                     {bl(`Job Type ${idx}`, `Befattningstyp ${idx}`)}: <span className="text-foreground">{jt || "—"}</span>
                  </p>
                  {salaryType === "hourly" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        {renderLabel(bl("Basic pay", "Grundlön") + " (SEK/hr)", "", true)}
                        <Input type="number" value={hb} onChange={(e) => setHb(e.target.value)} className="h-11 text-sm font-medium" placeholder="0" />
                      </div>
                      <div className="space-y-1.5">
                        {renderLabel(bl("Premium pay", "Premielön") + " (SEK/hr)", "", false)}
                        <Input type="number" value={hp} onChange={(e) => setHp(e.target.value)} className="h-11 text-sm font-medium" placeholder="0" />
                      </div>
                    </div>
                  )}
                  {salaryType === "monthly" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        {renderLabel(bl("Basic salary", "Grundlön") + " (SEK/mån)", "", true)}
                        <Input type="number" value={mb} onChange={(e) => setMb(e.target.value)} className="h-11 text-sm font-medium" placeholder="0" />
                      </div>
                      <div className="space-y-1.5">
                        {renderLabel(bl("Premium salary", "Premielön") + " (SEK/mån)", "", false)}
                        <Input type="number" value={mp} onChange={(e) => setMp(e.target.value)} className="h-11 text-sm font-medium" placeholder="0" />
                      </div>
                    </div>
                  )}
                  {(showHourlyWarn || showMonthlyWarn) && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 font-medium">
                        {showHourlyWarn && getSalaryWarning("hourly", hb, rate!.hourly)}
                        {showMonthlyWarn && getSalaryWarning("monthly", mb, rate!.monthly)}
                      </p>
                    </div>
                  )}
                </div>
                );
              })}

              {/* Overtime clause - language-aware */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  {(contractLanguage === "EN/SE") && (
                    <>
                      <p className="font-semibold text-foreground">Only ordered overtime will be compensated with overtime pay.</p>
                      <p className="text-muted-foreground italic">Endast beordrad övertid ersätts med övertidsersättning.</p>
                    </>
                  )}
                  {(contractLanguage === "SE") && (
                    <p className="font-semibold text-foreground">Endast beordrad övertid ersätts med övertidsersättning.</p>
                  )}
                  {(contractLanguage === "RO/SE") && (
                    <>
                      <p className="font-semibold text-foreground">Doar orele suplimentare dispuse vor fi compensate cu plata orelor suplimentare.</p>
                      <p className="text-muted-foreground italic">Endast beordrad övertid ersätts med övertidsersättning.</p>
                    </>
                  )}
                  {(contractLanguage === "TH/SE") && (
                    <>
                      <p className="font-semibold text-foreground">เฉพาะการทำงานล่วงเวลาที่ได้รับคำสั่งเท่านั้นที่จะได้รับค่าชดเชยการทำงานล่วงเวลา</p>
                      <p className="text-muted-foreground italic">Endast beordrad övertid ersätts med övertidsersättning.</p>
                    </>
                  )}
                  {(contractLanguage === "UK/SE") && (
                    <>
                      <p className="font-semibold text-foreground">Лише замовлена понаднормова робота буде компенсована оплатою за понаднормову роботу.</p>
                      <p className="text-muted-foreground italic">Endast beordrad övertid ersätts med övertidsersättning.</p>
                    </>
                  )}
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
                     {bl("Piece-work pay", "Ackordslön")} * <span className="font-normal text-xs">({bl("specified in \"Other\" below", "specificeras under \"Övrigt\"")})</span>
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
                     {bl("Other salary benefits by separate agreement", "Andra löneförmåner enligt separat avtal")}
                  </span>
                </div>
              </div>

              {/* Reference notes */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
                <p>{bl("** See Section 7A of Skogsavtalet regarding salary components and that the monthly salary consists of 174 hours' pay.", "** Se avsnitt 7A i Skogsavtalet om lönekomponenter och att månadslönen utgörs av 174 timmars lön.")}</p>
                <p>{bl("* Possible for time-limited employees in forestry work, see Section 7A, Paragraph 2 of Skogsavtalet.", "* Möjligt för tidsbegränsat anställda i skogsarbete, se avsnitt 7A, stycke 2 i Skogsavtalet.")}</p>
                <p>{bl("Regarding rules and compensation for overtime work, see Sections 5 and 8 of Skogsavtalet.", "Angående regler och ersättning för övertidsarbete, se §§ 5 och 8 i Skogsavtalet.")}</p>
              </div>

              {/* Payment method */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold uppercase tracking-wider">
                     {bl("Payment Method", "Utbetalningssätt")}
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
                      <span className="text-sm font-medium">{bl("Into the specified account", "Till angivet konto")}</span>
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
                      <span className="text-sm font-medium">{bl("In cash", "Kontant")}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bl("No later than on the 25th of each month in arrears or on a fixed date as determined by the employer. If the payment date falls on a day other than Monday–Friday or on a weekend or public holiday, the salary shall normally be paid on the preceding weekday.", "Senast den 25:e varje månad i efterskott eller på ett fast datum som bestäms av arbetsgivaren. Om utbetalningsdagen infaller på en annan dag än måndag–fredag eller på en helg eller allmän helgdag, ska lönen normalt betalas ut på närmast föregående vardag.")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rate not applied warning */}
        {showRateWarning && (
          <Card className="border-2 border-destructive/30 bg-destructive/5 shadow-lg animate-fade-in">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                   <p className="text-sm font-semibold">{bl("Official rate not applied", "Officiell lön ej tillämpad")}</p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {bl("You have not applied the official collective agreement rate for all job types. Are you sure you want to continue without applying it?", "Du har inte tillämpat den officiella kollektivavtalslönen för alla befattningstyper. Är du säker på att du vill fortsätta utan att tillämpa den?")}
                   </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 ml-8">
                 <Button variant="outline" size="sm" onClick={() => setShowRateWarning(false)}>
                   {bl("Go back", "Gå tillbaka")}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => {
                  setShowRateWarning(false);
                  // Continue to salary prompt or next
                  if (!pieceWorkPay && !otherSalaryBenefits && !showSalaryPrompt) {
                    setShowSalaryPrompt(true);
                  } else {
                    setShowSalaryPrompt(false);
                    onNext();
                  }
                 }}>
                   {bl("Continue anyway", "Fortsätt ändå")}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Salary options prompt dialog — centered modal */}
        {showSalaryPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowSalaryPrompt(false); onNext(); }}>
            <Card className="border-2 border-primary/30 bg-background shadow-2xl animate-fade-in w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                     <p className="text-sm font-semibold">{bl("Before continuing", "Innan du fortsätter")}</p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {bl("Would you also like to include any of the following salary options?", "Vill du även inkludera något av följande lönealternativ?")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 ml-8">
                  <div
                    className={cn(
                      "rounded-xl border p-3 cursor-pointer transition-colors",
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
                      <span className={cn("text-sm font-medium", !pieceWorkPay && "text-muted-foreground")}>
                        {bl("Piece-work pay", "Ackordslön")}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl border p-3 cursor-pointer transition-colors",
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
                       <span className={cn("text-sm font-medium", !otherSalaryBenefits && "text-muted-foreground")}>
                         {bl("Other salary benefits", "Andra löneförmåner")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 ml-8">
                   <Button variant="outline" size="sm" onClick={() => { setShowSalaryPrompt(false); onNext(); }}>
                     {bl("Skip", "Hoppa över")}
                   </Button>
                   <Button size="sm" onClick={() => { setShowSalaryPrompt(false); onNext(); }}>
                     {bl("Continue", "Fortsätt")}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        </>}

        {/* === Section 9: Training (activeSection === "section-9") === */}
        {activeSection === "section-9" && <>
        <Collapsible open={section9Open} onOpenChange={setSection9Open}>
          
            <SectionHeader
              number="9"
              titleEn="Training"
              titleSv="Utbildning"
              open={section9Open}
              onToggle={() => setSection9Open(!section9Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">📚</span>
                    {bl("Mandatory Training", "Obligatorisk utbildning")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-sm text-muted-foreground">
                     {bl("Mandatory training (if appropriate) to which the employee is entitled:", "Obligatorisk utbildning (om tillämpligt) som den anställde har rätt till:")}
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
                         {bl("Forestry care and management training program", "Utbildningsprogram för skogsvård och skötsel")}
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
                         {bl("Forestry vocational board – safety & project handling certification", "Skogsbrukets yrkesnämnd – säkerhet & projekthanteringscertifiering")}
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
                       <p className="text-sm font-semibold">{bl("Additional training", "Annan utbildning")}</p>
                       <p className="text-xs text-muted-foreground">
                         {bl("Additional training requirements", "Ytterligare utbildningskrav")}
                       </p>
                    </div>
                  </button>

                  {trainingOtherEnabled && (
                    <textarea
                      value={trainingOtherText}
                      onChange={(e) => setTrainingOtherText(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder={bl("Describe additional training...", "Beskriv ytterligare utbildning...")}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Section 10: Social Security (activeSection === "section-10") === */}
        {activeSection === "section-10" && <>
        <Collapsible open={section10Open} onOpenChange={setSection10Open}>
          
            <SectionHeader
              number="10"
              titleEn="Social Security"
              titleSv="Socialförsäkring"
              open={section10Open}
              onToggle={() => setSection10Open(!section10Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">🛡️</span>
                    {bl("Social Security", "Socialförsäkring")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-4">
                    <p className="text-sm leading-relaxed">
                      {bl("The employer pays employer's contributions to the state in accordance with the Swedish Social Security Act (2000:980).", "Arbetsgivaren betalar arbetsgivaravgifter till staten i enlighet med socialförsäkringsbalken (2000:980).")}
                    </p>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">
                      {contractLanguage !== "SE" && "Arbetsgivaren betalar arbetsgivaravgifter till staten i enlighet med socialförsäkringsbalken (2000:980)."}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {bl("Employed workers are entitled to sick pay in accordance with the Swedish Sick Pay Act (1991:1047) and the following collective agreement-based benefits:", "Anställda arbetstagare har rätt till sjuklön enligt sjuklönelagen (1991:1047) och följande kollektivavtalsbaserade förmåner:")}
                    </p>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">
                      {contractLanguage !== "SE" && "Anställda arbetstagare har rätt till sjuklön enligt sjuklönelagen (1991:1047) och följande kollektivavtalsbaserade förmåner:"}
                    </p>
                    <ul className="text-sm leading-relaxed list-disc list-inside space-y-1.5 pl-2">
                      <li>{bl("Contractual pension SAF-LO", "Avtalspension SAF-LO")} {contractLanguage !== "SE" && <span className="italic text-muted-foreground">/ Avtalspension SAF-LO</span>}</li>
                      <li>{bl("Contractual group health insurance (AGS)", "Avtalsgruppsjukförsäkring (AGS)")} {contractLanguage !== "SE" && <span className="italic text-muted-foreground">/ Avtalsgruppsjukförsäkring (AGS)</span>}</li>
                      <li>{bl("Parental benefit supplement (FPT)", "Föräldrapenningtillägg (FPT)")} {contractLanguage !== "SE" && <span className="italic text-muted-foreground">/ Föräldrapenningtillägg (FPT)</span>}</li>
                      <li>{bl("Employment transition fund (TSL)", "Omställningsförsäkring (TSL)")} {contractLanguage !== "SE" && <span className="italic text-muted-foreground">/ Omställningsförsäkring (TSL)</span>}</li>
                      <li>{bl("Occupational injury insurance (TFA)", "Trygghetsförsäkring vid arbetsskada (TFA)")} {contractLanguage !== "SE" && <span className="italic text-muted-foreground">/ Trygghetsförsäkring vid arbetsskada (TFA)</span>}</li>
                      <li>{bl("Occupational group life insurance", "Tjänstegrupplivförsäkring")} {contractLanguage !== "SE" && <span className="italic text-muted-foreground">/ Tjänstegrupplivförsäkring</span>}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Section 11: Miscellaneous (activeSection === "section-11") === */}
        {activeSection === "section-11" && <>
        <Collapsible open={section11Open} onOpenChange={setSection11Open}>
          
            <SectionHeader
              number="11"
              titleEn="Miscellaneous"
              titleSv="Övrigt"
              open={section11Open}
              onToggle={() => setSection11Open(!section11Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">📝</span>
                    {bl("Miscellaneous", "Övrigt")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {bl("State any other terms and conditions for the employment arrangement, e.g. pay and benefits in addition to the applicable collective agreement.", "Ange övriga villkor för anställningen, t.ex. lön och förmåner utöver tillämpligt kollektivavtal.")}
                  </p>
                  <textarea
                    value={miscellaneousText}
                    onChange={(e) => setMiscellaneousText(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={bl("Enter additional terms and conditions...", "Ange ytterligare villkor...")}
                  />
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Section 12: Notes (activeSection === "section-12") === */}
        {activeSection === "section-12" && <>
        <Collapsible open={true}>
          
            <SectionHeader
              number="12"
              titleEn="Notes"
              titleSv="Noter"
              open={true}
              onToggle={() => {}}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">📋</span>
                    {bl("Notes", "Noter")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-4">
                    <ol className="list-decimal list-outside space-y-3 pl-5 text-sm leading-relaxed">
                      <li>
                        {bl("The period of notice is set out in Section 4 of Skogsavtalet.", "Uppsägningstiden framgår av Skogsavtalet §4.")}
                        {contractLanguage !== "SE" && <><br /><span className="italic text-muted-foreground">Uppsägningstiden framgår av Skogsavtalet §4.</span></>}
                      </li>
                      <li>
                        {bl("Terms and conditions for the probationary period and its termination are set out in Section 4 of Skogsavtalet.", "Villkor för provanställningen samt dess avslutande framgår av Skogsavtalet §4.")}
                        {contractLanguage !== "SE" && <><br /><span className="italic text-muted-foreground">Villkor för provanställningen samt dess avslutande framgår av Skogsavtalet §4.</span></>}
                      </li>
                      <li>
                        {bl("The conditions that apply for the employment to cease are set out in Section 4 of Skogsavtalet.", "De förutsättningar som gäller för att anställningen ska upphöra framgår av Skogsavtalet §4.")}
                        {contractLanguage !== "SE" && <><br /><span className="italic text-muted-foreground">De förutsättningar som gäller för att anställningen ska upphöra framgår av Skogsavtalet §4.</span></>}
                      </li>
                      <li>
                        {bl("If an employee has been employed by the employer in a general fixed-term employment arrangement for a total of more than two years over a five-year period, the employment arrangement becomes a permanent one.", "Om en arbetstagare varit anställd hos arbetsgivaren i allmän visstidsanställning i sammanlagt mer än två år under en femårsperiod övergår anställningen till en tillsvidareanställning.")}
                        {contractLanguage !== "SE" && <><br /><span className="italic text-muted-foreground">Om en arbetstagare varit anställd hos arbetsgivaren i allmän visstidsanställning i sammanlagt mer än två år under en femårsperiod övergår anställningen till en tillsvidareanställning.</span></>}
                      </li>
                      <li>
                        {bl("This employment arrangement also ends if and when the employment of the regular holder of the position ends in accordance with Section 4 of Skogsavtalet. If an employee has been employed by the employer as a temporary replacement for a total of more than two years over a five-year period, the employment arrangement becomes a permanent one.", "Denna anställning upphör även om och när den ordinarie befattningshavarens anställning upphör enligt Skogsavtalet §4. Om en arbetstagare har varit anställd hos arbetsgivaren som vikarie i sammanlagt mer än två år under en femårsperiod, övergår anställningen till en tillsvidareanställning.")}
                        {contractLanguage !== "SE" && <><br /><span className="italic text-muted-foreground">Denna anställning upphör även om och när den ordinarie befattningshavarens anställning upphör enligt Skogsavtalet §4. Om en arbetstagare har varit anställd hos arbetsgivaren som vikarie i sammanlagt mer än två år under en femårsperiod, övergår anställningen till en tillsvidareanställning.</span></>}
                      </li>
                      <li>
                        {bl("The limitation period shall not exceed 16 weeks. With the support of a local agreement, the limitation period may be longer, but no longer than 12 months (annual working time).", "Begränsningsperioden får högst vara 16 veckor. Med stöd av lokal överenskommelse kan begränsningsperioden vara längre, dock längst 12 månader (årsarbetstid).")}
                        {contractLanguage !== "SE" && <><br /><span className="italic text-muted-foreground">Begränsningsperioden får högst vara 16 veckor. Med stöd av lokal överenskommelse kan begränsningsperioden vara längre, dock längst 12 månader (årsarbetstid).</span></>}
                      </li>
                    </ol>

                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-sm leading-relaxed">
                        {bl("Otherwise, the termination of the employment relationship is subject to Sections 8-10, 19, 20, 30, 33, 33c and 34-37 of the Swedish Employment Protection Act (LAS).", "I övrigt gäller för avslutande av anställningsförhållandet vad som följer av §§ LAS 8-10, 19, 20, 30, 33, 33c och 34-37.")}
                      </p>
                      {contractLanguage !== "SE" && <p className="text-sm leading-relaxed italic text-muted-foreground">
                        I övrigt gäller för avslutande av anställningsförhållandet vad som följer av §§ LAS 8-10, 19, 20, 30, 33, 33c och 34-37.
                      </p>}
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-sm leading-relaxed">
                        {bl("Deadlines for notification and bringing an action in the event of a dispute concerning termination of employment are set out in Sections 40-42 of the Swedish Employment Protection Act (LAS).", "Frister för underrättelse och väckande av talan vid tvist om avslut av anställning finns i §§ LAS 40-42.")}
                      </p>
                      {contractLanguage !== "SE" && <p className="text-sm leading-relaxed italic text-muted-foreground">
                        Frister för underrättelse och väckande av talan vid tvist om avslut av anställning finns i §§ LAS 40-42.
                      </p>}
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-sm leading-relaxed">
                        {bl("Rules for notice, information and the obligation to negotiate are set out in Section 11-14 of the Swedish Employment (Co-Determination in the Workplace) Act (MBL).", "Regler för varsel, information och förhandlingsskyldighet finns i §§ MBL 11-14.")}
                      </p>
                      {contractLanguage !== "SE" && <p className="text-sm leading-relaxed italic text-muted-foreground">
                        Regler för varsel, information och förhandlingsskyldighet finns i §§ MBL 11-14.
                      </p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Section 13: Salary Deductions (activeSection === "section-13") === */}
        {activeSection === "section-13" && <>
        <Collapsible open={section13Open} onOpenChange={setSection13Open}>
          
            <SectionHeader
              number="13"
              titleEn="Salary Deductions"
              titleSv="Löneavdrag"
              open={section13Open}
              onToggle={() => setSection13Open(!section13Open)}
            />
          
          <CollapsibleContent>
            <div className="pt-4 pb-2 px-2 space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">💰</span>
                    {bl("Net Salary Deductions", "Nettolöneavdrag")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-sm text-muted-foreground">
                     {bl("Define recurring or one-time deductions from the employee's net salary.", "Definiera återkommande eller engångsavdrag från den anställdes nettolön.")}
                  </p>

                  {salaryDeductions.map((deduction, index) => {
                    const typeInfo = DEDUCTION_TYPES.find(t => t.value === deduction.type);
                    return (
                      <Card key={deduction.id} className="border border-border bg-muted/30">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {typeInfo ? bl(typeInfo.label, typeInfo.labelSv) : bl("Deduction", "Avdrag")}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-7 px-2"
                              onClick={() => {
                                setSalaryDeductions(prev => prev.filter(d => d.id !== deduction.id));
                              }}
                            >
                              {bl("Remove", "Ta bort")}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">{bl("Amount (SEK)", "Belopp (SEK)")}</label>
                              <Input
                                type="number"
                                value={deduction.amount}
                                onChange={(e) => {
                                  setSalaryDeductions(prev => prev.map(d =>
                                    d.id === deduction.id ? { ...d, amount: e.target.value } : d
                                  ));
                                }}
                                placeholder="0.00"
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">{bl("Frequency", "Frekvens")}</label>
                              <Select
                                value={deduction.frequency}
                                onValueChange={(val) => {
                                  setSalaryDeductions(prev => prev.map(d =>
                                    d.id === deduction.id ? { ...d, frequency: val } : d
                                  ));
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="monthly">{bl("Monthly", "Månatligen")}</SelectItem>
                                   <SelectItem value="one-time">{bl("One-time", "Engångs")}</SelectItem>
                                   <SelectItem value="per-km">{bl("Per km", "Per km")}</SelectItem>
                                   <SelectItem value="seasonal">{bl("Per season", "Per säsong")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {deduction.type === "car" && (
                            <div className="rounded-md bg-accent/50 border border-border px-3 py-2">
                              <p className="text-xs text-muted-foreground">
                                💡 {bl("For company car usage, set the per-km rate. The total deduction will be calculated based on kilometers driven.", "Ange pris per km. Totalavdraget beräknas utifrån körda kilometer.")}
                              </p>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">{bl("Note", "Anteckning")}</label>
                            <Input
                              value={deduction.note}
                              onChange={(e) => {
                                setSalaryDeductions(prev => prev.map(d =>
                                  d.id === deduction.id ? { ...d, note: e.target.value } : d
                                ));
                              }}
                              placeholder={bl("Optional description...", "Valfri beskrivning...")}
                              className="h-9"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Add deduction buttons */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{bl("Add Deduction", "Lägg till avdrag")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEDUCTION_TYPES.map(dt => (
                        <button
                          key={dt.value}
                          type="button"
                          onClick={() => {
                            setSalaryDeductions(prev => [...prev, {
                              id: crypto.randomUUID(),
                              type: dt.value,
                              label: dt.label,
                              labelSv: dt.labelSv,
                              amount: "",
                              frequency: dt.value === "car" ? "per-km" : "monthly",
                              note: "",
                            }]);
                          }}
                          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 p-3 text-left transition-all"
                        >
                          <span className="text-lg">
                            {dt.value === "rent" ? "🏠" : dt.value === "car" ? "🚗" : dt.value === "travel" ? "✈️" : dt.value === "immigration" ? "🏛️" : "📄"}
                          </span>
                          <div>
                            <p className="text-xs font-semibold">{bl(dt.label, dt.labelSv)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {salaryDeductions.length > 0 && (
                    <div className="rounded-lg border border-border bg-accent/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{bl("Total Monthly Deductions", "Totala månatliga avdrag")}</span>
                        <span className="text-sm font-bold text-destructive">
                          {salaryDeductions
                            .filter(d => d.frequency === "monthly" && d.amount)
                            .reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0)
                            .toLocaleString("sv-SE")} SEK / month
                        </span>
                      </div>
                      {salaryDeductions.some(d => d.frequency === "one-time" && d.amount) && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{bl("One-time deductions", "Engångsavdrag")}</span>
                          <span className="text-xs font-medium">
                            {salaryDeductions
                              .filter(d => d.frequency === "one-time" && d.amount)
                              .reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0)
                              .toLocaleString("sv-SE")} SEK
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confirmation checkbox */}
              <Card className="border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="deductions-confirmed"
                      checked={deductionsConfirmed}
                      onCheckedChange={(checked) => setDeductionsConfirmed(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="deductions-confirmed" className="text-sm cursor-pointer leading-relaxed">
                       <span className="font-semibold">{bl("I confirm that I have reviewed and verified the salary deductions entered above are correct for this contract.", "Jag bekräftar att jag har granskat och kontrollerat att ovanstående löneavdrag är korrekta för detta avtal.")}</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        </>}

        {/* === Scheduling (activeSection === "section-scheduling") === */}
         {activeSection === "section-scheduling" && (
          <SchedulingStep
            initialData={schedulingData}
            onChange={setSchedulingData}
            onBack={onBack}
            onNext={onNext}
            contractId={contractId}
            contractLanguage={contractLanguage}
          />
        )}

        {/* === Signing (activeSection === "section-14") === */}
        {activeSection === "section-14" && <>
        <div className="space-y-1 mb-4">
          <div className={cn(
            "w-full flex items-center justify-between rounded-full border px-6 py-3 text-sm font-semibold",
            "border-primary bg-primary/5 text-primary"
          )}>
            <span>{bl("Signing", "Underskrift")}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Contract Preview for Print */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">📄</span>
                {bl("Contract Preview", "Avtalsförhandsgranskning")}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" />
                {bl("Print", "Skriv ut")}
              </Button>
            </CardHeader>
            <CardContent className="p-0 border-t border-border">
              <div className="max-h-[500px] overflow-y-auto">
                <ContractDocument
                  ref={printRef}
                  companyName={company.name}
                  companyOrgNumber={company.org_number}
                  companyAddress={company.address}
                  companyPostcode={company.postcode}
                  companyCity={company.city}
                  contractCode={contractCode}
                  seasonYear={seasonYear || new Date().getFullYear().toString()}
                  formData={getFormData()}
                  employeeSignatureUrl={employeeSignatureUrl || null}
                  employerSignatureUrl={employerSignatureUrl || null}
                  employeeSignedAt={null}
                  employerSignedAt={null}
                />
              </div>
            </CardContent>
          </Card>

          {/* E-Signing */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">✍️</span>
                {bl("E-Signing", "E-signering")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <p className="text-sm text-muted-foreground">
                 {bl("Send this contract for electronic signing, or use the Print button above to print and sign on paper.", "Skicka detta avtal för elektronisk signering, eller använd knappen Skriv ut ovan för att skriva ut och signera på papper.")}
              </p>

              {/* Status indicator */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    signingStatus === "not_sent" ? "bg-muted-foreground/40" :
                    signingStatus === "sent_to_employee" ? "bg-warning animate-pulse" :
                    signingStatus === "employee_signed" ? "bg-primary" :
                    "bg-primary"
                  )} />
                  <span className="text-sm font-medium">
                     {signingStatus === "not_sent" && bl("Not yet sent for signing", "Ännu ej skickat för signering")}
                     {signingStatus === "sent_to_employee" && bl("Awaiting employee signature", "Väntar på anställds underskrift")}
                     {signingStatus === "employee_signed" && bl("Employee signed – awaiting employer signature", "Anställd har signerat – väntar på arbetsgivarens underskrift")}
                     {signingStatus === "employer_signed" && `✅ ${bl("Fully signed", "Fullständigt signerat")}`}
                  </span>
                </div>

                {/* Step 1: Send for signing */}
                {signingStatus === "not_sent" && (
                  <div className="space-y-3">
                    {allMissingFields.length > 0 && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                        <p className="text-sm font-medium text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {bl(`Contract has ${allMissingFields.length} missing required field(s)`, `Avtalet har ${allMissingFields.length} obligatoriska fält som saknas`)}
                        </p>
                        <ul className="text-xs text-destructive/80 list-disc pl-5 space-y-0.5">
                          {allMissingFields.slice(0, 8).map((f, i) => <li key={i}>{f}</li>)}
                          {allMissingFields.length > 8 && <li>{bl(`...and ${allMissingFields.length - 8} more`, `...och ${allMissingFields.length - 8} till`)}</li>}
                        </ul>
                        <p className="text-xs text-muted-foreground">{bl("Please go back and complete all required sections before sending for signing.", "Gå tillbaka och fyll i alla obligatoriska avsnitt innan du skickar för signering.")}</p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleSendForSigning}
                      disabled={sendingForSigning || allMissingFields.length > 0}
                    >
                      {sendingForSigning ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {bl("Preparing signing...", "Förbereder signering...")}</>
                      ) : (
                        bl("Send for E-Signing", "Skicka för e-signering")
                      )}
                    </Button>
                  </div>
                )}

                {/* Step 2: Employee signing - open simulation in new tab */}
                {signingStatus === "sent_to_employee" && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-accent/30 p-3 space-y-2">
                      <p className="text-xs font-medium">{bl("Signing link (fallback)", "Signeringslänk (reserv)")}:</p>
                      <div className="flex gap-2">
                        <Input value={signingLink} readOnly className="h-8 text-xs" />
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(signingLink); toast.success(bl("Link copied", "Länk kopierad")); }}>{bl("Copy", "Kopiera")}</Button>
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => window.open(signingLink, "_blank")}
                    >
                      <Users className="w-4 h-4" />
                      {bl("Open Signing Page", "Öppna signeringssida")}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {bl("Opens the actual signing page the employee received.", "Öppnar den faktiska signeringssidan som den anställde fick.")}
                    </p>
                  </div>
                )}

                {/* Step 3: Employer counter-sign */}
                {signingStatus === "employee_signed" && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="text-sm font-medium text-primary flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {bl("Employee has signed. Now add the employer signature below.", "Anställd har signerat. Lägg nu till arbetsgivarens underskrift nedan.")}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{bl("Employer Signature", "Arbetsgivarens underskrift")}</p>
                    <SignatureCanvas onSave={handleEmployerSign} disabled={submittingEmployerSig} />
                    {submittingEmployerSig && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> {bl("Saving...", "Sparar...")}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Fully signed */}
                {signingStatus === "employer_signed" && (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                    <p className="text-lg font-semibold text-primary">{bl("Contract Fully Signed", "Avtal fullständigt signerat")}</p>
                    <p className="text-sm text-muted-foreground">
                      {bl("Both parties have signed. You can print the final contract above.", "Båda parter har signerat. Du kan skriva ut det slutliga avtalet ovan.")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        </>}
      </CardContent>
    </Card>
    </div>
  );
}
