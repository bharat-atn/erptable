import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckSquare,
  TrendingUp,
  ClipboardCheck,
  Send,
  Users,
  Calendar,
  Info,
  ArrowRight,
  Star,
} from "lucide-react";

export function TimeReportingProcessGuideView({ t: _t }: { t?: (key: string) => string }) {
  const t = _t || ((k: string) => k);

  return (
    <div className="space-y-4 pt-2 pb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("tr.processGuide")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("tr.guideSub")}
        </p>
      </div>

      {/* Overview Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t("tr.aboutThisApp")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("tr.aboutThisAppDesc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Summary */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            {t("tr.weeklyWorkflow")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="space-y-3">
            {[
              { step: 1, labelKey: "tr.step1", icon: CheckSquare, descKey: "tr.step1Desc" },
              { step: 2, labelKey: "tr.step2", icon: TrendingUp, descKey: "tr.step2Desc" },
              { step: 3, labelKey: "tr.step3", icon: Send, descKey: "tr.step3Desc" },
              { step: 4, labelKey: "tr.step4", icon: ClipboardCheck, descKey: "tr.step4Desc" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {item.step}
                </div>
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t(item.labelKey)}</p>
                  <p className="text-[10px] text-muted-foreground">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sections */}
      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="attendance" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              {t("tr.weeklyAttendance")}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <p>
              {t("tr.weeklyAttendanceDesc")}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="progress" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {t("tr.progressReporting")}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <p>
              {t("tr.progressReportingDesc")}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="approvals" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              {t("tr.reportApprovals")}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <p>
              {t("tr.approvalsSub")}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Note */}
      <Card className="border-border/40 bg-muted/30">
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground text-center">
            {t("tr.needHelp")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
