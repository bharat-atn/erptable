import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Building2, Check, ChevronDown, Circle } from "lucide-react";

interface Company {
  id: string;
  name: string;
  org_number: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
}

const steps = [
  { id: 1, label: "Company", labelSv: "Företag", icon: Building2 },
];

export function ContractTemplateView() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyOpen, setCompanyOpen] = useState(true);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const isStepCompleted = (stepId: number) => {
    if (stepId === 1) return !!selectedCompanyId;
    return false;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contract Template</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Build a contract step by step
        </p>
      </div>

      <div className="flex gap-6">
        {/* Wizard sidebar */}
        <div className="w-60 shrink-0">
          <Card className="shadow-md">
            <CardContent className="p-3 space-y-1">
              {steps.map((step) => {
                const completed = isStepCompleted(step.id);
                const active = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-left",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    {completed ? (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Circle
                        className={cn(
                          "w-4 h-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground/40"
                        )}
                      />
                    )}
                    <span>
                      {step.label}{" "}
                      <span className="text-muted-foreground font-normal text-xs">
                        / {step.labelSv}
                      </span>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Step content */}
        <div className="flex-1">
          {activeStep === 1 && (
            <Card className="shadow-md">
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
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="h-11 text-sm font-medium">
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCompany && (
                  <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
                    <Card className="border-2 border-border shadow-sm">
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="py-4 px-5 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            Company Details / Företagsuppgifter
                          </CardTitle>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform duration-200",
                              companyOpen && "rotate-180"
                            )}
                          />
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="px-5 pb-5 pt-0">
                          <div className="space-y-4">
                            {/* Row 1: Employer + Org Number */}
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
                            {/* Row 2: Address (full width) */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                Address / Adress
                              </label>
                              <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                                {selectedCompany.address || "—"}
                              </div>
                            </div>
                            {/* Row 3: Postcode + City */}
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
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
