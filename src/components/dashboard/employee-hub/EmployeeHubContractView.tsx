import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Building2, DollarSign, CheckCircle2, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function EmployeeHubContractView() {
  const [previewContract, setPreviewContract] = useState<any>(null);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["employee-hub-contracts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // Find employee by email
      const { data: profile } = await supabase.from("profiles").select("email").eq("user_id", user.id).single();
      if (!profile?.email) return [];
      const { data: emp } = await supabase.from("employees").select("id").eq("email", profile.email).maybeSingle();
      if (!emp) return [];
      const { data } = await supabase
        .from("contracts")
        .select("*, companies(name)")
        .eq("employee_id", emp.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const formData = (c: any) => (c.form_data || {}) as Record<string, any>;

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold">My Contracts</h1>

      {contracts.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="pt-6 text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No contracts found</p>
          </CardContent>
        </Card>
      ) : (
        contracts.map((c: any) => {
          const fd = formData(c);
          return (
            <Card key={c.id} className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {c.contract_code && (
                        <Badge variant="outline" className="font-mono text-xs">{c.contract_code}</Badge>
                      )}
                      <Badge className={c.status === "signed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 border-0"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 border-0"
                      }>
                        {c.status === "signed" ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Signed</> : c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Season {c.season_year || "—"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPreviewContract(c)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Employer</p>
                      <p className="text-xs font-medium">{(c as any).companies?.name || fd.companySnapshot?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Period</p>
                      <p className="text-xs font-medium">{c.start_date || "—"} → {c.end_date || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Salary</p>
                      <p className="text-xs font-medium">{c.salary ? `${Number(c.salary).toLocaleString()} SEK` : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Signing</p>
                      <p className="text-xs font-medium">{c.signing_status?.replace(/_/g, " ") || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Contract clauses from form_data */}
                {fd.clauses && Object.keys(fd.clauses).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Contract Terms</p>
                      <div className="space-y-1.5">
                        {Object.entries(fd.clauses).map(([key, val]: [string, any]) => (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-medium min-w-[120px] text-muted-foreground">{key}:</span>
                            <span>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Full Contract Dialog */}
      <Dialog open={!!previewContract} onOpenChange={(o) => !o && setPreviewContract(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Employment Contract {previewContract?.contract_code && `— ${previewContract.contract_code}`}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            {previewContract && (
              <div className="space-y-4 pr-4">
                <ContractSection title="§1 Employer" content={`${(previewContract as any).companies?.name || formData(previewContract).companySnapshot?.name || "—"}`} />
                <ContractSection title="§2 Employment Period" content={`${previewContract.start_date || "—"} to ${previewContract.end_date || "—"} (Season ${previewContract.season_year || "—"})`} />
                <ContractSection title="§3 Compensation" content={`${previewContract.salary ? `${Number(previewContract.salary).toLocaleString()} SEK` : "—"}`} />
                <ContractSection title="§4 Working Hours" content={formData(previewContract).workingHours || "According to schedule"} />
                <ContractSection title="§5 Place of Work" content={formData(previewContract).placeOfWork || "As assigned by employer"} />
                <ContractSection title="§6 Collective Agreement" content={formData(previewContract).collectiveAgreement || "GS Kollektivavtal — Skogs- och Lantbruksarbetsgivareförbundet"} />
                
                {/* Signatures */}
                <Separator />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Employee Signature</p>
                    {previewContract.employee_signature_url ? (
                      <img src={previewContract.employee_signature_url} alt="Employee signature" className="h-16 object-contain" />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Not yet signed</p>
                    )}
                    {previewContract.employee_signed_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">Signed: {new Date(previewContract.employee_signed_at).toLocaleDateString("sv-SE")}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Employer Signature</p>
                    {previewContract.employer_signature_url ? (
                      <img src={previewContract.employer_signature_url} alt="Employer signature" className="h-16 object-contain" />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Not yet signed</p>
                    )}
                    {previewContract.employer_signed_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">Signed: {new Date(previewContract.employer_signed_at).toLocaleDateString("sv-SE")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContractSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground mt-0.5">{content}</p>
    </div>
  );
}
