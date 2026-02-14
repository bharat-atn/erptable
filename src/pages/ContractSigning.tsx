import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureCanvas } from "@/components/dashboard/SignatureCanvas";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import logoImg from "@/assets/ljungan-forestry-logo.png";

interface SigningData {
  contract_id: string;
  contract_code: string;
  company_name: string;
  employee_first_name: string;
  employee_last_name: string;
  signing_status: string;
  employee_signed_at: string | null;
  employer_signed_at: string | null;
}

export default function ContractSigning() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SigningData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data: rows, error: err } = await supabase.rpc("get_contract_for_signing", {
        _token: token,
      });
      if (err || !rows || rows.length === 0) {
        setError("Invalid or expired signing link.");
        setLoading(false);
        return;
      }
      setData(rows[0] as SigningData);
      setLoading(false);
    };
    load();
  }, [token]);

  const handleSign = async (dataUrl: string) => {
    if (!token || !data) return;
    setSubmitting(true);

    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filePath = `employee/${data.contract_id}.png`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from("signatures")
        .upload(filePath, blob, { upsert: true, contentType: "image/png" });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(filePath);

      // Submit signature via RPC
      const { error: rpcErr } = await supabase.rpc("submit_employee_signature", {
        _token: token,
        _signature_url: urlData.publicUrl,
      });

      if (rpcErr) throw rpcErr;

      setSigned(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Signing Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const alreadySigned = data.signing_status !== "sent_to_employee" || data.employee_signed_at;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src={logoImg} alt="Logo" className="h-12 mx-auto" />
          <h1 className="text-2xl font-bold">Employment Contract Signing</h1>
          <p className="text-sm text-muted-foreground">Contract: {data.contract_code}</p>
        </div>

        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Details / Avtalsdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employee / Anställd</p>
                <p className="font-medium">{data.employee_first_name} {data.employee_last_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Company / Företag</p>
                <p className="font-medium">{data.company_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signing Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employee Signature / Anställds underskrift</CardTitle>
          </CardHeader>
          <CardContent>
            {signed || alreadySigned ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg font-semibold text-green-700">
                  Signed Successfully / Signerat framgångsrikt
                </p>
                <p className="text-sm text-muted-foreground">
                  The contract will now be sent to the employer for their signature. / 
                  Avtalet skickas nu till arbetsgivaren för deras underskrift.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please draw your signature below to sign this employment contract. / 
                  Vänligen rita din underskrift nedan för att signera detta anställningsavtal.
                </p>
                <SignatureCanvas onSave={handleSign} disabled={submitting} />
                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting signature...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
