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
import { cn } from "@/lib/utils";
import { Building2, Check, Circle } from "lucide-react";

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
  // Future steps will be added here
];

export function ContractTemplateView() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

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
        <h1 className="text-2xl font-semibold">Contract Template</h1>
        <p className="text-muted-foreground text-sm">
          Build a contract step by step
        </p>
      </div>

      <div className="flex gap-6">
        {/* Wizard sidebar */}
        <div className="w-56 shrink-0">
          <Card>
            <CardContent className="p-3 space-y-1">
              {steps.map((step) => {
                const completed = isStepCompleted(step.id);
                const active = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Select Company{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    / Välj företag
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger>
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
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-4 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div>
                          <span className="text-muted-foreground">Employer / Arbetsgivare</span>
                          <p className="font-medium">{selectedCompany.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Org. Number / Organisationsnummer</span>
                          <p className="font-medium">{selectedCompany.org_number || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Address / Adress</span>
                          <p className="font-medium">{selectedCompany.address || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Postcode / Postnummer</span>
                          <p className="font-medium">{selectedCompany.postcode || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">City / Ort</span>
                          <p className="font-medium">{selectedCompany.city || "—"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
