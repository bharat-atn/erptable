import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "./SignatureCanvas";
import { ContractDocument } from "./ContractDocument";
import { Loader2, CheckCircle, FileText, Calendar, RotateCcw, Send, Image, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

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

  // Place & Date
  const [signingPlace, setSigningPlace] = useState("");
  const [signingDate, setSigningDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Signature preview (redo flow)
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);

  // Default signature
  const [defaultSignatureUrl, setDefaultSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!contractId || !open) return;
    setSigned(false);
    setPendingSignature(null);
    setSigningPlace("");
    setSigningDate(format(new Date(), "yyyy-MM-dd"));
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

      // Fetch default signature from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("default_signature_url")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.default_signature_url) {
          setDefaultSignatureUrl(profile.default_signature_url);
        }
      }

      setLoading(false);
    };
    load();
  }, [contractId, open]);

  const handleSign = async (dataUrl: string) => {
    if (!contractId) return;
    setSubmitting(true);
    try {
      // If it's already a URL (default signature), use directly
      let signatureUrl = dataUrl;
      if (dataUrl.startsWith("data:")) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const filePath = `employer/${contractId}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("signatures")
          .upload(filePath, blob, { upsert: true, contentType: "image/png" });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(filePath);
        signatureUrl = urlData.publicUrl;
      }

      // Build eIDAS SES signing metadata
      const signingMetadata = {
        place: signingPlace,
        date: signingDate,
        userAgent: navigator.userAgent,
        consentText: "Employer counter-signature confirming contract terms.",
        signedAt: new Date().toISOString(),
      };

      const { error: rpcErr } = await supabase.rpc("submit_employer_signature", {
        _contract_id: contractId,
        _signature_url: signatureUrl,
        _signing_metadata: signingMetadata,
      });
      if (rpcErr) throw rpcErr;

      setSigned(true);
      toast.success("Contract signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      // Auto-send contract email to employee
      if (employee?.email) {
        try {
          await supabase.functions.invoke("send-contract-email", {
            body: { contractId, recipientEmail: employee.email },
          });
          toast.success(`Contract email sent to ${employee.email}`);
        } catch (emailErr: any) {
          console.error("Auto-send contract email failed:", emailErr);
          toast.info("Contract signed, but email could not be sent automatically. You can resend from the Employee Register.");
        }
      }
      queryClient.invalidateQueries({ queryKey: ["pending-signatures-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-signatures-details"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  };

  const fd = (contract?.form_data || {}) as Record<string, any>;
  const empName = employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() : "—";
  const placeValid = signingPlace.trim().length > 0;

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
                  employeeSignatureUrl={contract.employee_signature_url ? `${contract.employee_signature_url}?t=${Date.now()}` : null}
                  employerSignatureUrl={null}
                  employeeSignedAt={contract.employee_signed_at}
                  employeeSigningMetadata={contract.employee_signing_metadata as Record<string, any> | undefined}
                />
              </CardContent>
            </Card>

            {/* Place, Date & Employer Signature — merged into one card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Place, Date & Signature / Plats, datum & underskrift</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Place and Date / Plats och datum
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="employer-signing-place" className="text-sm">Place / Plats *</Label>
                      <Input
                        id="employer-signing-place"
                        value={signingPlace}
                        onChange={(e) => setSigningPlace(e.target.value)}
                        placeholder="e.g. Stockholm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="employer-signing-date" className="text-sm">Date / Datum</Label>
                      <Input
                        id="employer-signing-date"
                        type="text"
                        placeholder="YYYY-MM-DD"
                        maxLength={10}
                        value={signingDate}
                        onChange={(e) => setSigningDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                {!placeValid && (
                  <p className="text-sm text-warning">
                    Please enter the signing place above before signing.
                  </p>
                )}

                {pendingSignature ? (
                  /* Signature preview & redo */
                  <div className="space-y-4">
                    <p className="text-sm font-medium">
                      Review your signature:
                    </p>
                    <div className="rounded-lg border-2 border-primary/30 bg-background p-4">
                      <img
                        src={pendingSignature}
                        alt="Employer signature preview"
                        className="max-h-[120px] mx-auto"
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setPendingSignature(null)}
                        disabled={submitting}
                        className="gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Redo
                      </Button>
                      <Button
                        onClick={() => handleSign(pendingSignature)}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {submitting ? "Submitting..." : "Submit Signature"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Default signature option */}
                    {defaultSignatureUrl && (
                      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Image className="w-4 h-4 text-primary" />
                          Use saved signature
                        </p>
                        <div className="rounded border border-border bg-background p-3">
                          <img
                            src={defaultSignatureUrl}
                            alt="Default signature"
                            className="max-h-[80px] mx-auto"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => placeValid && setPendingSignature(defaultSignatureUrl)}
                          disabled={!placeValid || submitting}
                          className="gap-2"
                        >
                          <Image className="w-4 h-4" />
                          Use this signature
                        </Button>
                      </div>
                    )}

                    {/* Upload signature option */}
                    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        Upload signature image
                      </p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        disabled={!placeValid || submitting}
                        className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 512000) {
                            toast.error("File too large. Max 500KB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result && placeValid) {
                              setPendingSignature(reader.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {defaultSignatureUrl ? "Or draw your signature below:" : "Or draw your signature below to counter-sign this contract as the employer."}
                    </p>
                    <SignatureCanvas
                      onSave={(dataUrl) => placeValid && setPendingSignature(dataUrl)}
                      disabled={submitting || !placeValid}
                    />
                  </>
                )}

                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting signature...
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
