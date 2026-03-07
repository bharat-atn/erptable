import { useRef, useState } from "react";
import { CONTRACT_PRINT_CSS } from "@/lib/contract-print-styles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContractDocument } from "./ContractDocument";
import { Printer, Mail, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ContractPreviewDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractPreviewDialog({ contractId, open, onOpenChange }: ContractPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract-preview", contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const { data, error } = await supabase
        .from("contracts")
        .select(`*, employees (email, first_name, last_name, middle_name, phone), companies (name, org_number, address, postcode, city)`)
        .eq("id", contractId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!contractId && open,
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    const contractCode = contract?.contract_code || "Draft";
    const docTitle = `Employment Contract — ${contractCode}`;

    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${docTitle}</title>
<style>${CONTRACT_PRINT_CSS}</style>
</head><body>${printRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSendEmail = async () => {
    if (!emailTo || !contractId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contract-email", {
        body: { contractId, recipientEmail: emailTo },
      });
      if (error) throw error;
      toast.success(`Contract sent to ${emailTo}`);
      setShowEmailForm(false);
      setEmailTo("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const fd = (contract?.form_data as Record<string, any>) || {};
  const emp = contract?.employees as any;
  const comp = contract?.companies as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold">Contract Preview</h2>
          <div className="flex items-center gap-2">
            {!showEmailForm ? (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  setShowEmailForm(true);
                  setEmailTo(emp?.email || "");
                }}>
                  <Mail className="w-3.5 h-3.5" /> Email
                </Button>
                <Button variant="default" size="sm" className="gap-1.5" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Send to:</Label>
                <Input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="email@example.com"
                  className="h-8 w-56 text-sm"
                />
                <Button size="sm" className="gap-1" disabled={!emailTo || sending} onClick={handleSendEmail}>
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  Send
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowEmailForm(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Document preview */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : contract ? (
            <ContractDocument
              ref={printRef}
              companyName={comp?.name || "—"}
              companyOrgNumber={comp?.org_number}
              companyAddress={comp?.address}
              companyPostcode={comp?.postcode}
              companyCity={comp?.city}
              contractCode={contract.contract_code}
              seasonYear={contract.season_year}
              formData={fd}
              employeeSignatureUrl={contract.employee_signature_url}
              employerSignatureUrl={contract.employer_signature_url}
              employeeSignedAt={contract.employee_signed_at}
              employerSignedAt={contract.employer_signed_at}
              employeeSigningMetadata={contract.employee_signing_metadata as Record<string, any> | undefined}
              employerSigningMetadata={contract.employer_signing_metadata as Record<string, any> | undefined}
            />
          ) : (
            <p className="text-center text-muted-foreground">Contract not found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
