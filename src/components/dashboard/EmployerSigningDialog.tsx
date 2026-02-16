import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureCanvas } from "./SignatureCanvas";
import { ContractDocument } from "./ContractDocument";
import { Loader2, CheckCircle, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EmployerSigningDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployerSigningDialog({ contractId, open, onOpenChange }: EmployerSigningDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [contract, setContract] = useState<Record<string, any> | null>(null);
  const [company, setCompany] = useState<Record<string, any> | null>(null);
  const [employee, setEmployee] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!contractId || !open) return;
    setSigned(false);
    setLoading(true);

    const load = async () => {
      const { data: c } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .maybeSingle();

      if (!c) { setLoading(false); return; }
      setContract(c);

      if (c.company_id) {
        const { data: comp } = await supabase.from("companies").select("name, org_number, address, postcode, city").eq("id", c.company_id).maybeSingle();
        if (comp) setCompany(comp);
      }

      const { data: emp } = await supabase.from("employees").select("first_name, last_name, email").eq("id", c.employee_id).maybeSingle();
      if (emp) setEmployee(emp);

      
      setLoading(false);
    };
    load();
  }, [contractId, open]);

  const handleSign = async (dataUrl: string) => {
    if (!contractId) return;
    setSubmitting(true);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filePath = `employer/${contractId}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("signatures")
        .upload(filePath, blob, { upsert: true, contentType: "image/png" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(filePath);

      const { error: rpcErr } = await supabase.rpc("submit_employer_signature", {
        _contract_id: contractId,
        _signature_url: urlData.publicUrl,
      });
      if (rpcErr) throw rpcErr;

      setSigned(true);
      toast.success("Contract signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-signatures-count"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  };

  const fd = (contract?.form_data || {}) as Record<string, any>;
  const empName = employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Review & Counter-Sign Contract
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : signed ? (
          <div className="text-center py-12 space-y-3">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <p className="text-lg font-semibold text-primary">Contract Fully Signed!</p>
            <p className="text-sm text-muted-foreground">
              Both employee and employer signatures have been recorded. The contract is now active.
            </p>
          </div>
        ) : contract ? (
          <div className="space-y-4">
            {/* Contract summary */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Contract:</span>
              <span className="font-medium">{contract.contract_code || "—"}</span>
              <span className="text-muted-foreground">Employee:</span>
              <span className="font-medium">{empName}</span>
              <span className="text-muted-foreground">Season:</span>
              <span className="font-medium">{contract.season_year || "—"}</span>
              <span className="text-muted-foreground">Employee signed:</span>
              <span className="font-medium text-primary">
                {contract.employee_signed_at ? new Date(contract.employee_signed_at).toLocaleDateString() : "—"}
              </span>
            </div>

            {/* Full contract document */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ContractDocument
                  companyName={company?.name || "—"}
                  companyOrgNumber={company?.org_number}
                  companyAddress={company?.address}
                  companyPostcode={company?.postcode}
                  companyCity={company?.city}
                  contractCode={contract.contract_code}
                  seasonYear={contract.season_year}
                  formData={fd}
                  employeeSignatureUrl={contract.employee_signature_url}
                  employerSignatureUrl={null}
                />
              </CardContent>
            </Card>

            {/* Employer signature */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employer Signature / Arbetsgivarens underskrift</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Draw your signature below to counter-sign this contract as the employer.
                </p>
                <SignatureCanvas onSave={handleSign} disabled={submitting} />
                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting signature...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
