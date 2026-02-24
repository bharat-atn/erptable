import { useRef, useState } from "react";
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
<style>
  @page { size: A4; margin: 14mm 12mm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11px; line-height: 1.45; color: #1a1a1a; margin: 0; padding: 0; }
  .contract-doc { max-width: 100%; }
  .doc-header { text-align: center; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid #1a1a1a; }
  .doc-header h1 { font-size: 16px; margin: 0 0 4px; letter-spacing: 0.5px; }
  .doc-subtitle { font-size: 11px; color: #555; margin: 2px 0; }
  .doc-legal-lang { font-size: 9px; color: #777; margin-top: 4px; }
  .section-title { font-size: 12px; margin: 14px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #ccc; }
  .field-grid-2, .field-grid-3 { display: grid; gap: 6px 16px; margin-bottom: 8px; }
  .field-grid-2 { grid-template-columns: 1fr 1fr; }
  .field-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .field { display: flex; flex-direction: column; }
  .field-label { font-size: 5.5px; text-transform: uppercase; color: #bbb; letter-spacing: 0.15px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
  .field-value { font-size: 12px; font-weight: 800; padding: 2px 0; border-bottom: 1px dotted #ccc; min-height: 16px; color: #000; }
  .subsection-label { font-size: 10px; font-weight: 600; margin: 8px 0 4px; color: #444; }
  .info-block { background: #f8f8f8; padding: 8px 10px; border-radius: 3px; margin-bottom: 8px; font-size: 10px; }
  .info-sv, .info-sv-inline { color: #666; font-style: italic; }
  .info-list { margin: 4px 0; padding-left: 18px; }
  .info-list li { margin-bottom: 2px; }
  .info-text-muted { color: #999; font-style: italic; }
  .checklist { margin-bottom: 8px; }
  .check-item { margin: 3px 0; font-size: 11px; }
  .training-mandatory-badge { font-size: 8px; background: #fee; color: #c00; padding: 1px 4px; border-radius: 2px; margin-left: 4px; }
  .legal-notes p { margin: 3px 0; font-size: 10px; }
  .deduction-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
  .deduction-table th, .deduction-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
  .deduction-table th { background: #f5f5f5; font-weight: 600; }
  .signatures-section { margin-top: 24px; }
  .sig-title { margin-bottom: 4px; }
  .sig-intro { font-size: 10px; color: #555; margin-bottom: 12px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .sig-column { display: flex; flex-direction: column; gap: 12px; }
  .sig-field { display: flex; flex-direction: column; }
  .sig-line { border-bottom: 1px solid #333; min-height: 24px; display: flex; align-items: flex-end; padding-bottom: 2px; overflow: visible; }
  .sig-line-tall { min-height: 50px; overflow: visible; }
  .sig-prefill { font-size: 11px; color: #333; }
  .sig-label { font-size: 7px; text-transform: uppercase; color: #aaa; margin-top: 2px; font-weight: 400; }
  .sig-date { font-size: 7px; color: #999; margin-top: 1px; }
  .sig-img { max-height: 50px; max-width: 180px; object-fit: contain; display: block; }
  .page-break-avoid { page-break-inside: avoid; }
</style>
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
            />
          ) : (
            <p className="text-center text-muted-foreground">Contract not found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
