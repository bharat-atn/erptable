import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Info, Building2 } from "lucide-react";

export function PaymentMethodsView() {
  const paymentMethods = [
    { method: "Bankgiro", desc: "Standard Swedish bank transfer via Bankgirot", code: "BG", default: true, details: "Most common method for salary payments in Sweden" },
    { method: "Plusgiro", desc: "Payment via Plusgirot/SEB", code: "PG", default: false, details: "Alternative bank transfer method" },
    { method: "SWIFT/IBAN", desc: "International bank transfer", code: "SWIFT", default: false, details: "For employees with foreign bank accounts" },
    { method: "Utbetalningskort", desc: "Payment voucher (cash pickup)", code: "UK", default: false, details: "For employees without Swedish bank accounts" },
  ];

  const bankIntegrations = [
    { bank: "Swedbank", status: "Available", format: "Bankgiro Inbetalningar", fileFormat: ".bgc" },
    { bank: "SEB", status: "Available", format: "SEB Löneservice", fileFormat: ".txt" },
    { bank: "Handelsbanken", status: "Available", format: "Bankgiro direkt", fileFormat: ".bgc" },
    { bank: "Nordea", status: "Available", format: "Nordea Corporate", fileFormat: ".pain.001" },
    { bank: "Danske Bank", status: "Planned", format: "ISO 20022", fileFormat: ".xml" },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Betalningsmetoder • Salary payment configuration</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Payment Processing</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure how salary payments are distributed to employees. Swedish Bankgiro is the default
            method. International transfers use SWIFT/IBAN for employees with foreign bank accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10"><CreditCard className="w-4 h-4 text-primary" /></div>
              <div>
                <h3 className="font-semibold text-sm">Payment Methods</h3>
                <p className="text-[10px] text-muted-foreground">Supported salary payment channels</p>
              </div>
            </div>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm.code} className="flex items-start justify-between p-3 rounded-lg border border-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{pm.method}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{pm.code}</Badge>
                      {pm.default && <Badge className="text-[9px] bg-primary/10 text-primary border-0">Default</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pm.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{pm.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Building2 className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <h3 className="font-semibold text-sm">Bank File Integrations</h3>
                <p className="text-[10px] text-muted-foreground">Supported bank file export formats</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>File Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankIntegrations.map((b) => (
                  <TableRow key={b.bank}>
                    <TableCell className="text-sm font-medium">{b.bank}</TableCell>
                    <TableCell className="text-xs">{b.format}</TableCell>
                    <TableCell className="font-mono text-xs">{b.fileFormat}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${b.status === "Available" ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-amber-300"}`}>
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
