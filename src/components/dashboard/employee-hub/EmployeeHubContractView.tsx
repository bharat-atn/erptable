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
    <div className="space-y-4 px-2 pt-2 pb-24 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl mb-6">
        <h1 className="text-2xl font-bold">My Contracts</h1>
        <p className="text-sm text-white/80">Mina kontrakt</p>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-8 text-center shadow-sm">
          <FileText className="w-12 h-12 text-emerald-600/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No contracts found</p>
        </div>
      ) : (
        contracts.map((c: any) => {
          const fd = formData(c);
          return (
            <div key={c.id} className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {c.contract_code && (
                      <Badge variant="outline" className="font-mono text-xs border-emerald-600/30">{c.contract_code}</Badge>
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
                <Button variant="outline" size="sm" className="h-10 min-w-[70px] rounded-xl border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" onClick={() => setPreviewContract(c)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
              </div>

              <div className="h-px bg-emerald-600/20" />

              <div className="space-y-3">
                <ContractInfoRow icon={Building2} label="Employer" value={(c as any).companies?.name || fd.companySnapshot?.name || "—"} />
                <ContractInfoRow icon={Calendar} label="Period" value={`${c.start_date || "—"} → ${c.end_date || "—"}`} />
                <ContractInfoRow icon={DollarSign} label="Salary" value={c.salary ? `${Number(c.salary).toLocaleString()} SEK` : "—"} />
                <ContractInfoRow icon={FileText} label="Signing" value={c.signing_status?.replace(/_/g, " ") || "—"} />
              </div>
            </div>
          );
        })
      )}

      {/* Full Contract Dialog — optimized for mobile */}
      <Dialog open={!!previewContract} onOpenChange={(o) => !o && setPreviewContract(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              Contract {previewContract?.contract_code && `— ${previewContract.contract_code}`}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {previewContract && (
              <div className="space-y-4 pr-2">
                <ContractSection title="§1 Employer" content={`${(previewContract as any).companies?.name || formData(previewContract).companySnapshot?.name || "—"}`} />
                <ContractSection title="§2 Employment Period" content={`${previewContract.start_date || "—"} to ${previewContract.end_date || "—"} (Season ${previewContract.season_year || "—"})`} />
                <ContractSection title="§3 Compensation" content={`${previewContract.salary ? `${Number(previewContract.salary).toLocaleString()} SEK` : "—"}`} />
                <ContractSection title="§4 Working Hours" content={formData(previewContract).workingHours || "According to schedule"} />
                <ContractSection title="§5 Place of Work" content={formData(previewContract).placeOfWork || "As assigned by employer"} />
                <ContractSection title="§6 Collective Agreement" content={formData(previewContract).collectiveAgreement || "GS Kollektivavtal — Skogs- och Lantbruksarbetsgivareförbundet"} />

                {/* Signatures */}
                <Separator />
                <div className="space-y-4">
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

function ContractInfoRow({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-h-[36px]">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
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
