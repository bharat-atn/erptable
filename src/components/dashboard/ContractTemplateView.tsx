import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, Check, ChevronDown, Circle, Users, Search, X, Mail, Phone, Globe, ArrowLeft, User, Briefcase } from "lucide-react";
import { LanguageSelectionStep } from "./LanguageSelectionStep";
import { ContractDetailsStep } from "./ContractDetailsStep";
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
}];
export function ContractTemplateView() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyOpen, setCompanyOpen] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("EN/SE");
  const [contractId, setContractId] = useState<string | null>(null);
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
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const isStepCompleted = (stepId: number) => {
    if (stepId === 1) return !!selectedCompanyId;
    if (stepId === 2) return !!selectedEmployee;
    if (stepId === 3) return !!selectedLanguage;
    if (stepId === 4) return activeStep > 4;
    if (stepId === 5) return activeStep > 5;
    if (stepId === 6) return activeStep > 6;
    if (stepId === 7) return activeStep > 7;
    if (stepId === 8) return activeStep > 8;
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
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="h-11 text-sm font-medium">
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>

                {selectedCompany && <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
                    <Card className="border-2 border-border shadow-sm">
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="py-4 px-5 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            Company Details / Företagsuppgifter
                          </CardTitle>
                          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", companyOpen && "rotate-180")} />
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
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
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>}

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
                  <Button variant="outline" onClick={() => setActiveStep(1)}>
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
              // Create or reuse contract when entering step 4
              if (!contractId && selectedEmployee && selectedCompanyId) {
                const { data, error } = await supabase
                  .from("contracts")
                  .insert({
                    employee_id: selectedEmployee.id,
                    company_id: selectedCompanyId,
                    season_year: new Date().getFullYear().toString(),
                    status: "draft",
                  })
                  .select("id")
                  .single();
                if (!error && data) {
                  setContractId(data.id);
                }
              }
              setActiveStep(4);
            }} />}

          {activeStep >= 4 && activeStep <= 9 && selectedCompany && selectedEmployee && contractId && <ContractDetailsStep company={selectedCompany} employee={selectedEmployee} contractId={contractId} activeSection={activeStep === 4 ? "employee" : activeStep === 5 ? "section-3" : activeStep === 6 ? "section-4" : activeStep === 7 ? "section-5" : activeStep === 8 ? "section-6" : "section-7"} onBack={() => setActiveStep(activeStep === 4 ? 3 : activeStep - 1)} onNext={() => setActiveStep(activeStep + 1)} />}
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