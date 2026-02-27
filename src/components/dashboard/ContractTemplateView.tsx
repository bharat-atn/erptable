import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, Check, Circle, Users, Search, X, Mail, Phone, Globe, ArrowLeft, User, Briefcase, CalendarDays } from "lucide-react";
import { LanguageSelectionStep } from "./LanguageSelectionStep";
import { ContractDetailsStep } from "./ContractDetailsStep";
import { CodeOfConductStep } from "./CodeOfConductStep";
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
const steps = [{
  id: 1,
  label: "Company",
  labelSv: "Section 1",
  icon: Building2
}, {
  id: 2,
  label: "Employee Selection",
  labelSv: "",
  icon: Users
}, {
  id: 3,
  label: "Language Selection",
  labelSv: "",
  icon: Globe
}, {
  id: 4,
  label: "Employee Details",
  labelSv: "Section 2:1, 2:2 & 2:3",
  icon: User
}, {
  id: 5,
  label: "Employment",
  labelSv: "Section 3",
  icon: Briefcase
}, {
  id: 6,
  label: "Employment",
  labelSv: "Section 4",
  icon: Briefcase
}, {
  id: 7,
  label: "Employment",
  labelSv: "Section 5",
  icon: Briefcase
}, {
  id: 8,
  label: "Employment",
  labelSv: "Section 6",
  icon: Briefcase
}, {
  id: 9,
  label: "Compensation",
  labelSv: "Section 7",
  icon: Building2
}, {
  id: 10,
  label: "Salary",
  labelSv: "Section 8",
  icon: Building2
}, {
  id: 11,
  label: "Training",
  labelSv: "Section 9",
  icon: Briefcase
}, {
  id: 12,
  label: "Social Security",
  labelSv: "Section 10",
  icon: Building2
}, {
  id: 13,
  label: "Miscellaneous",
  labelSv: "Section 11",
  icon: Briefcase
}, {
  id: 14,
  label: "Notes",
  labelSv: "Section 12",
  icon: Briefcase
}, {
  id: 15,
  label: "Deductions",
  labelSv: "Section 13",
  icon: Building2
}, {
  id: 16,
  label: "Schedule",
  labelSv: "Schema",
  icon: CalendarDays
}, {
  id: 17,
  label: "Code of Conduct",
  labelSv: "Uppförandekod",
  icon: Briefcase
}, {
  id: 18,
  label: "Signing",
  labelSv: "Underskrift",
  icon: Briefcase
}];
type ResumeMode = "start" | "fasttrack" | "resume";

/** Steps visited in fast-track mode (skips non-essential sections) */
const FAST_TRACK_STEPS = [3, 4, 5, 7, 10, 16, 17, 18];

interface ContractTemplateViewProps {
  resumeContractId?: string | null;
  preselectedEmployeeId?: string | null;
  resumeMode?: ResumeMode;
}

export function ContractTemplateView({ resumeContractId, preselectedEmployeeId, resumeMode = "resume" }: ContractTemplateViewProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [isFastTrack, setIsFastTrack] = useState(false);

  /** Navigate to the next step, respecting fast-track sequence */
  const goNext = (fromStep: number) => {
    if (isFastTrack) {
      const idx = FAST_TRACK_STEPS.indexOf(fromStep);
      if (idx !== -1 && idx < FAST_TRACK_STEPS.length - 1) {
        setActiveStep(FAST_TRACK_STEPS[idx + 1]);
        return;
      }
    }
    setActiveStep(fromStep + 1);
  };

  /** Navigate to the previous step, respecting fast-track sequence */
  const goBack = (fromStep: number) => {
    if (isFastTrack) {
      const idx = FAST_TRACK_STEPS.indexOf(fromStep);
      if (idx > 0) {
        setActiveStep(FAST_TRACK_STEPS[idx - 1]);
        return;
      }
    }
    setActiveStep(fromStep === 4 ? 3 : fromStep - 1);
  };
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("EN/SE");
  const [contractId, setContractId] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [cocLanguage, setCocLanguage] = useState<string | null>(null);
  const [cocReviewed, setCocReviewed] = useState(false);
  const {
    data: companies = []
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("companies").select("*").order("name");
      if (error) throw error;
      return data as Company[];
    }
  });
  const {
    data: employees = []
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("employees").select("id, first_name, last_name, middle_name, email, phone, employee_code, city, country, personal_info").order("last_name");
      if (error) throw error;
      return data as Employee[];
    }
  });
  // Auto-select the first (only) company
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  // Auto-select employee and skip to language step when coming from Operations
  const [preselectionApplied, setPreselectionApplied] = useState(false);
  useEffect(() => {
    if (preselectedEmployeeId && !preselectionApplied && employees.length > 0 && companies.length > 0) {
      const emp = employees.find(e => e.id === preselectedEmployeeId);
      if (emp) {
        setSelectedEmployee(emp);
        setSelectedCompanyId(companies[0].id);
        setActiveStep(3); // skip to language selection
        setPreselectionApplied(true);
      }
    }
  }, [preselectedEmployeeId, preselectionApplied, employees, companies]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  // Resume draft contract - load existing data
  useEffect(() => {
    if (!resumeContractId || resumeLoaded || companies.length === 0 || employees.length === 0) return;

    const loadContract = async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", resumeContractId)
        .single();

      if (error || !data) return;

      setContractId(data.id);
      if (data.company_id) setSelectedCompanyId(data.company_id);

      const emp = employees.find(e => e.id === data.employee_id);
      if (emp) setSelectedEmployee(emp);

      // Determine which step to resume at based on form_data and resumeMode
      const formData = (data.form_data as Record<string, any>) || {};
      let resumeStep = 4; // default to employee details

      // Load saved states
      if (formData.contractLanguage) setSelectedLanguage(formData.contractLanguage);
      if (formData.cocLanguage) setCocLanguage(formData.cocLanguage);
      if (formData.cocReviewed) setCocReviewed(formData.cocReviewed);

      if (resumeMode === "start") {
        // From Start: go to language selection (step 3), keeping company/employee
        resumeStep = 3;
      } else if (resumeMode === "fasttrack") {
        // Fast Track: start at language selection, then guided through key steps
        resumeStep = 3;
        setIsFastTrack(true);
      } else {
        // Resume: use the explicitly saved step if available
        if (formData.lastActiveSection) {
          const sectionToStepMap: Record<string, number> = {
            "employee": 4, "section-3": 5, "section-4": 6, "section-5": 7,
            "section-6": 8, "section-7": 9, "section-8": 10, "section-9": 11,
            "section-10": 12, "section-11": 13, "section-12": 14, "section-13": 15,
            "section-scheduling": 16, "section-14": 18,
          };
          resumeStep = sectionToStepMap[formData.lastActiveSection] ?? 4;
        } else if (formData.cocReviewed) {
          resumeStep = 17;
        } else {
          resumeStep = 4; // default
        }
      }

      setActiveStep(resumeStep);
      setResumeLoaded(true);
    };

    loadContract();
  }, [resumeContractId, resumeLoaded, companies, employees]);
  const isStepCompleted = (stepId: number) => {
    if (stepId === 1) return !!selectedCompanyId;
    if (stepId === 2) return !!selectedEmployee;
    if (stepId === 3) return !!selectedLanguage;
    if (stepId >= 4 && stepId <= 16) return activeStep > stepId;
    if (stepId === 17) return cocReviewed;
    if (stepId === 18) return false;
    return false;
  };
  const filteredEmployees = employees.filter(e => {
    if (!employeeSearch) return true;
    const term = employeeSearch.toLowerCase();
    const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.toLowerCase();
    return name.includes(term) || e.email.toLowerCase().includes(term) || (e.employee_code ?? "").toLowerCase().includes(term);
  });
  const getInitials = (e: Employee) => {
    const f = (e.first_name ?? "").charAt(0).toUpperCase();
    const l = (e.last_name ?? "").charAt(0).toUpperCase();
    return f + l || "?";
  };
  const handleNextFromStep1 = () => {
    if (selectedCompanyId) {
      setActiveStep(2);
    }
  };
  return <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contract Template</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Build a contract step by step
        </p>
      </div>

      <div className="flex gap-6">
        {/* Wizard sidebar */}
        <div className="w-60 shrink-0 sticky top-6 self-start">
          <Card className="shadow-md">
            <CardContent className="p-3 space-y-1">
              {steps.map(step => {
              const completed = isStepCompleted(step.id);
              const active = activeStep === step.id;
              return <button key={step.id} onClick={() => setActiveStep(step.id)} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-left", active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted/60")}>
                    {completed ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Circle className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground/40")} />}
                    <span className="">
                      {step.label}{" "}
    {step.labelSv && <span className="text-muted-foreground font-normal text-xs">
                        / {step.labelSv}
                      </span>}
                    </span>
                  </button>;
            })}
            </CardContent>
          </Card>
        </div>

        {/* Step content */}
        <div className="flex-1">
          {activeStep === 1 && <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Select Company{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    / Välj företag
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedCompany && <>
                    <Card className="border-2 border-border shadow-sm">
                        <CardHeader className="py-4 px-5">
                          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            Company Details / Företagsuppgifter
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                  Employer / Arbetsgivare
                                </label>
                                <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                                  {selectedCompany.name}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                  Organization Number / Organisationsnummer
                                </label>
                                <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                                  {selectedCompany.org_number || "—"}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                Address / Adress
                              </label>
                              <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                                {selectedCompany.address || "—"}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                  Postcode / Postnummer
                                </label>
                                <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                                  {selectedCompany.postcode || "—"}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                  City / Ort
                                </label>
                                <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground uppercase">
                                  {selectedCompany.city || "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                    </Card>
                </>}

                {/* Next button */}
                {selectedCompanyId && <div className="flex justify-end pt-2">
                    <Button onClick={handleNextFromStep1} className="px-8">
                      Next
                    </Button>
                  </div>}
              </CardContent>
            </Card>}

          {activeStep === 2 && <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Select Employee{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    / Välj anställd
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedEmployee ? <div className="flex items-center gap-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                    <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center font-bold text-sm">
                      {getInitials(selectedEmployee)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedEmployee.email}
                        </span>
                        {selectedEmployee.phone && <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedEmployee.phone}
                          </span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEmployeeDialogOpen(true)}>
                      Change
                    </Button>
                  </div> : <Button variant="outline" className="w-full h-14 text-sm border-dashed border-2" onClick={() => setEmployeeDialogOpen(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Select an employee from the register...
                  </Button>}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-2">
                  <Button variant="back" onClick={() => setActiveStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  {selectedEmployee && <Button onClick={() => setActiveStep(3)} className="px-8">
                      Next
                    </Button>}
                </div>
              </CardContent>
            </Card>}

          {activeStep === 3 && <LanguageSelectionStep selectedLanguage={selectedLanguage} onSelectLanguage={setSelectedLanguage} onBack={() => setActiveStep(2)} onNext={async () => {
              // Helper: build employee fields for form_data from employee record
              const buildEmployeeFormData = (emp: Employee) => {
                const pi = emp.personal_info || {};
                return {
                  employeeFirstName: emp.first_name || pi.firstName || "",
                  employeeMiddleName: emp.middle_name || pi.middleName || "",
                  employeeLastName: emp.last_name || pi.lastName || "",
                  employeeAddress: pi.address || "",
                  employeePostcode: pi.postcode || "",
                  employeeCity: emp.city || pi.city || "",
                  employeeCountry: emp.country || pi.country || "",
                  employeePhone: emp.phone || pi.phone || "",
                  employeeEmail: emp.email || pi.email || "",
                  employeeDob: pi.dob || pi.dateOfBirth || "",
                  employeeNationality: pi.nationality || "",
                  employeePassport: pi.passportNumber || "",
                  employeeTaxCountry: pi.taxCountry || "",
                  employeeBank: pi.bankName || "",
                  employeeBankAccount: pi.bankAccount || "",
                  employeeIban: pi.iban || "",
                  employeeBic: pi.bic || "",
                  employeeEmergencyName: pi.emergencyName || "",
                  employeeEmergencyPhone: pi.emergencyPhone || "",
                  employeeEmergencyRelation: pi.emergencyRelation || "",
                };
              };

              // Pre-populate form_data with employee info on contract creation/reuse
              const prefillEmployeeData = async (cId: string, emp: Employee) => {
                const { data: rec } = await supabase.from("contracts").select("form_data").eq("id", cId).single();
                const fd = (rec?.form_data as Record<string, any>) || {};
                // Only prefill if employee fields are missing
                if (!fd.employeeFirstName && !fd.employeeLastName) {
                  const empFields = buildEmployeeFormData(emp);
                  await supabase.from("contracts").update({
                    form_data: { ...fd, ...empFields },
                  }).eq("id", cId);
                }
              };

              // Create or reuse contract when entering step 4
              if (!contractId && selectedEmployee && selectedCompanyId) {
                // Check for existing draft/active contract for this employee
                const { data: existing } = await supabase
                  .from("contracts")
                  .select("id")
                  .eq("employee_id", selectedEmployee.id)
                  .in("status", ["draft", "active"])
                  .in("signing_status", ["not_sent", "sent_to_employee"])
                  .limit(1)
                  .maybeSingle();

                if (existing) {
                  setContractId(existing.id);
                  const { data: ex } = await supabase.from("contracts").select("form_data").eq("id", existing.id).single();
                  const fd = (ex?.form_data as Record<string, any>) || {};
                  const empFields = (!fd.employeeFirstName && !fd.employeeLastName) ? buildEmployeeFormData(selectedEmployee) : {};
                  await supabase.from("contracts").update({
                    company_id: selectedCompanyId,
                    form_data: { ...fd, ...empFields, contractLanguage: selectedLanguage },
                  }).eq("id", existing.id);
                } else {
                  const empFields = buildEmployeeFormData(selectedEmployee);
                  const { data, error } = await supabase
                    .from("contracts")
                    .insert({
                      employee_id: selectedEmployee.id,
                      company_id: selectedCompanyId,
                      season_year: new Date().getFullYear().toString(),
                      status: "draft",
                      form_data: { ...empFields, contractLanguage: selectedLanguage },
                    })
                    .select("id")
                    .single();
                  if (!error && data) {
                    setContractId(data.id);
                  }
                }
              } else if (contractId) {
                // Update language + prefill employee data if missing
                const { data: existing } = await supabase.from("contracts").select("form_data").eq("id", contractId).single();
                const fd = (existing?.form_data as Record<string, any>) || {};
                const empFields = selectedEmployee && (!fd.employeeFirstName && !fd.employeeLastName) ? buildEmployeeFormData(selectedEmployee) : {};
                await supabase.from("contracts").update({ form_data: { ...fd, ...empFields, contractLanguage: selectedLanguage } }).eq("id", contractId);
              }
              goNext(3);
            }} />}

          {activeStep >= 4 && activeStep <= 16 && selectedCompany && selectedEmployee && contractId && <ContractDetailsStep company={selectedCompany} employee={selectedEmployee} contractId={contractId} activeSection={activeStep === 4 ? "employee" : activeStep === 5 ? "section-3" : activeStep === 6 ? "section-4" : activeStep === 7 ? "section-5" : activeStep === 8 ? "section-6" : activeStep === 9 ? "section-7" : activeStep === 10 ? "section-8" : activeStep === 11 ? "section-9" : activeStep === 12 ? "section-10" : activeStep === 13 ? "section-11" : activeStep === 14 ? "section-12" : activeStep === 15 ? "section-13" : "section-scheduling"} onBack={() => goBack(activeStep)} onNext={() => goNext(activeStep)} onGoToStep={(step: number) => setActiveStep(step)} />}

          {activeStep === 17 && selectedCompany && selectedEmployee && contractId && <CodeOfConductStep selectedLanguage={cocLanguage} onSelectLanguage={setCocLanguage} reviewed={cocReviewed} onSetReviewed={setCocReviewed} onBack={() => goBack(17)} onNext={async () => {
            // Persist COC data to form_data
            const { data: existing } = await supabase.from("contracts").select("form_data").eq("id", contractId).single();
            const fd = (existing?.form_data as Record<string, any>) || {};
            await supabase.from("contracts").update({ form_data: { ...fd, cocLanguage, cocReviewed: true } }).eq("id", contractId);
            goNext(17);
          }} />}

          {activeStep === 18 && selectedCompany && selectedEmployee && contractId && <ContractDetailsStep company={selectedCompany} employee={selectedEmployee} contractId={contractId} activeSection="section-14" onBack={() => goBack(18)} onNext={() => {}} onGoToStep={(step: number) => setActiveStep(step)} />}
        </div>
      </div>

      {/* Employee selection dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="bg-primary rounded-t-lg -mx-6 -mt-6 px-6 py-4">
            <DialogTitle className="text-primary-foreground flex items-center gap-2 text-base">
              <Users className="w-5 h-5" />
              Select Employee
            </DialogTitle>
            <p className="text-primary-foreground/80 text-sm">
              Choose the employee for whom you are drafting this contract
            </p>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} className="pl-9" />
            {employeeSearch && <button onClick={() => setEmployeeSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>}
          </div>

          <div className="max-h-72 overflow-y-auto -mx-2 space-y-0.5">
            {filteredEmployees.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">
                No employees found
              </p> : filteredEmployees.map(emp => <button key={emp.id} onClick={() => {
            setSelectedEmployee(emp);
            setEmployeeDialogOpen(false);
            setEmployeeSearch("");
          }} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-muted/60 transition-colors", selectedEmployee?.id === emp.id && "bg-primary/10")}>
                  <div className="w-9 h-9 rounded-full bg-success/20 text-success flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(emp)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {emp.email}
                      </span>
                      {emp.phone && <span className="shrink-0">{emp.phone}</span>}
                    </div>
                  </div>
                </button>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}