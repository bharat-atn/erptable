import { useRef, useState } from "react";
import { CONTRACT_PRINT_CSS } from "@/lib/contract-print-styles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContractDocument } from "./ContractDocument";
import { CodeOfConductViewer } from "./CodeOfConductViewer";
import { Printer, Mail, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { COC_MAP } from "./CodeOfConductViewer";
import {
  CONTRACT_LABELS as CL,
  bilingualLabel as bl,
  primaryText as pt,
  type LangCode,
} from "@/lib/contract-translations";

interface ContractPreviewDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Map contract language code to CoC language key */
function cocLangKey(lang: string): string {
  switch (lang) {
    case "SE": return "sv";
    case "RO/SE": return "ro";
    case "TH/SE": return "th";
    case "UK/SE": return "uk";
    default: return "en";
  }
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return val; }
}

function esc(v: any): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  // Fetch schedule rows for the contract
  const { data: scheduleRows } = useQuery({
    queryKey: ["contract-schedule", contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from("contract_schedules")
        .select("*")
        .eq("contract_id", contractId)
        .order("schedule_date", { ascending: true });
      if (error) throw error;
      return data || [];
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
    const fd = (contract?.form_data as Record<string, any>) || {};
    const lang: LangCode = fd.contractLanguage || "EN/SE";
    const isSEOnly = lang === "SE";

    // Build Appendix A — Code of Conduct HTML
    let cocHtml = "";
    const cocPrimaryKey = cocLangKey(lang);
    const cocPrimary = !isSEOnly ? COC_MAP[cocPrimaryKey] : null;
    const cocSv = COC_MAP["sv"];

    cocHtml += `<div style="page-break-before:always;"></div>`;
    cocHtml += `<h2 class="section-title">${bl(CL.appendixCoC, lang)}</h2>`;

    if (cocPrimary && cocPrimaryKey !== "sv") {
      cocHtml += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${esc(cocPrimary.title)}</h3>`;
      cocHtml += `<div class="coc-section">`;
      for (const s of cocPrimary.sections) {
        if (s.heading) cocHtml += `<p class="coc-heading">${esc(s.heading)}</p>`;
        cocHtml += `<p class="coc-body">${esc(s.body)}</p>`;
      }
      cocHtml += `</div>`;
      cocHtml += `<div style="page-break-before:always;"></div>`;
    }

    cocHtml += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${esc(cocSv.title)}</h3>`;
    cocHtml += `<div class="coc-section">`;
    for (const s of cocSv.sections) {
      if (s.heading) cocHtml += `<p class="coc-heading">${esc(s.heading)}</p>`;
      cocHtml += `<p class="coc-body">${esc(s.body)}</p>`;
    }
    cocHtml += `</div>`;

    // Build Appendix B — Work Schedule HTML
    let scheduleHtml = "";
    scheduleHtml += `<div style="page-break-before:always;"></div>`;
    scheduleHtml += `<h2 class="section-title">${bl(CL.appendixSchedule, lang)}</h2>`;

    const rows = scheduleRows || [];
    if (rows.length > 0) {
      scheduleHtml += `<table class="schedule-table"><thead><tr>`;
      scheduleHtml += `<th>${bl(CL.scheduleDate, lang)}</th>`;
      scheduleHtml += `<th>${bl(CL.scheduleDayType, lang)}</th>`;
      scheduleHtml += `<th>${bl(CL.scheduleHours, lang)}</th>`;
      scheduleHtml += `<th>${bl(CL.scheduleStart, lang)}</th>`;
      scheduleHtml += `<th>${bl(CL.scheduleEnd, lang)}</th>`;
      scheduleHtml += `<th>${bl(CL.scheduleHoliday, lang)}</th>`;
      scheduleHtml += `</tr></thead><tbody>`;

      for (const row of rows) {
        const isHoliday = row.day_type === "Holiday";
        const isWeekend = row.day_type === "Weekend";
        const trClass = isHoliday ? ' class="holiday"' : isWeekend ? ' class="weekend"' : '';
        const holidayName = lang === "SE" ? (row.holiday_name_sv || "") : (row.holiday_name_en || row.holiday_name_sv || "");
        scheduleHtml += `<tr${trClass}>`;
        scheduleHtml += `<td>${fmtDate(row.schedule_date)}</td>`;
        scheduleHtml += `<td>${esc(row.day_type)}</td>`;
        scheduleHtml += `<td>${row.scheduled_hours}</td>`;
        scheduleHtml += `<td>${esc(row.start_time) || "—"}</td>`;
        scheduleHtml += `<td>${esc(row.end_time) || "—"}</td>`;
        scheduleHtml += `<td>${esc(holidayName) || "—"}</td>`;
        scheduleHtml += `</tr>`;
      }
      scheduleHtml += `</tbody></table>`;

      const totalHours = rows.reduce((sum, r) => sum + (Number(r.scheduled_hours) || 0), 0);
      const workdays = rows.filter((r) => r.day_type === "Workday").length;
      scheduleHtml += `<p style="font-size:8.5pt;color:#555;margin-top:6px;">Total: ${totalHours}h · ${workdays} workdays</p>`;
    } else {
      scheduleHtml += `<p class="info-text-muted">${bl(CL.noSchedule, lang)}</p>`;
    }

    // Extra CSS for CoC and schedule that matches the email attachment
    const appendixCss = `
      .coc-section { margin-bottom: 12px; }
      .coc-heading { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 9pt; font-weight: 700; margin-top: 8px; margin-bottom: 2px; }
      .coc-body { font-size: 8.5pt; line-height: 1.45; white-space: pre-line; margin-bottom: 4px; }
      .schedule-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 8.5pt; }
      .schedule-table th { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 3px 6px; border-bottom: 2px solid #999; }
      .schedule-table td { padding: 3px 6px; border-bottom: 1px solid #ddd; }
      .schedule-table tr.weekend { background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .schedule-table tr.holiday { background: #fef3c7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `;

    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${docTitle}</title>
<style>${CONTRACT_PRINT_CSS}${appendixCss}</style>
</head><body>${printRef.current.innerHTML}${cocHtml}${scheduleHtml}</body></html>`);
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
            <>
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

              {/* Appendix A — Code of Conduct */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-bold text-center mb-4">{bl(CL.appendixCoC, lang)}</h3>
                {cocPrimaryKey !== "sv" && (
                  <div className="mb-6">
                    <CodeOfConductViewer language={cocPrimaryKey} />
                  </div>
                )}
                <CodeOfConductViewer language="sv" />
              </div>

              {/* Appendix B — Work Schedule */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-bold text-center mb-4">{bl(CL.appendixSchedule, lang)}</h3>
                {(scheduleRows || []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="text-left p-1.5 font-semibold text-muted-foreground uppercase text-[10px]">{bl(CL.scheduleDate, lang)}</th>
                          <th className="text-left p-1.5 font-semibold text-muted-foreground uppercase text-[10px]">{bl(CL.scheduleDayType, lang)}</th>
                          <th className="text-left p-1.5 font-semibold text-muted-foreground uppercase text-[10px]">{bl(CL.scheduleHours, lang)}</th>
                          <th className="text-left p-1.5 font-semibold text-muted-foreground uppercase text-[10px]">{bl(CL.scheduleStart, lang)}</th>
                          <th className="text-left p-1.5 font-semibold text-muted-foreground uppercase text-[10px]">{bl(CL.scheduleEnd, lang)}</th>
                          <th className="text-left p-1.5 font-semibold text-muted-foreground uppercase text-[10px]">{bl(CL.scheduleHoliday, lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(scheduleRows || []).map((row) => {
                          const isHoliday = row.day_type === "Holiday";
                          const isWeekend = row.day_type === "Weekend";
                          const holidayName = lang === "SE"
                            ? (row.holiday_name_sv || "")
                            : (row.holiday_name_en || row.holiday_name_sv || "");
                          return (
                            <tr
                              key={row.id}
                              className={
                                isHoliday ? "bg-amber-50" : isWeekend ? "bg-muted/50" : ""
                              }
                            >
                              <td className="p-1.5 border-b border-border">{fmtDate(row.schedule_date)}</td>
                              <td className="p-1.5 border-b border-border">{row.day_type}</td>
                              <td className="p-1.5 border-b border-border">{row.scheduled_hours}</td>
                              <td className="p-1.5 border-b border-border">{row.start_time || "—"}</td>
                              <td className="p-1.5 border-b border-border">{row.end_time || "—"}</td>
                              <td className="p-1.5 border-b border-border">{holidayName || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Total: {(scheduleRows || []).reduce((s, r) => s + (Number(r.scheduled_hours) || 0), 0)}h · {(scheduleRows || []).filter(r => r.day_type === "Workday").length} workdays
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">{bl(CL.noSchedule, lang)}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">Contract not found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
