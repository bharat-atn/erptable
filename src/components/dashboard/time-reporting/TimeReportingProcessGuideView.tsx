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
        <h1 className="text-xl font-bold text-foreground">Process Guide</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Handbok • How to use Time & Status Reporting
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
              <p className="text-sm font-medium text-foreground">About this app</p>
              <p className="text-xs text-muted-foreground mt-1">
                Time & Status Reporting is a mobile-first tool for team leaders to track
                weekly attendance, report project progress, and submit reports for manager approval.
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
            Weekly Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="space-y-3">
            {[
              { step: 1, label: "Register attendance", icon: CheckSquare, desc: "Mark who worked each day" },
              { step: 2, label: "Report progress", icon: TrendingUp, desc: "Update completion % per object" },
              { step: 3, label: "Submit report", icon: Send, desc: "Send for manager review" },
              { step: 4, label: "Approval", icon: ClipboardCheck, desc: "Manager approves or returns" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {item.step}
                </div>
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
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
              Weekly Attendance
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <p>
              The <strong>Attendance</strong> tab lets you record which team members worked each day of the week.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Select a project and navigate to the correct week</li>
              <li>Tap checkbox tiles to mark attendance for each employee per day</li>
              <li>Use the note icon (💬) to add comments per day (e.g., "arrived late")</li>
              <li>The system auto-calculates total hours based on the project's daily schedule</li>
              <li>Tap <Badge variant="outline" className="text-[10px] py-0 mx-1">Submit Week</Badge> when all attendance is recorded</li>
            </ul>
            <p className="text-amber-600 mt-2">
              ⚠️ Once submitted, attendance cannot be edited unless the report is returned by a manager.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="progress" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Progress Reporting
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <p>
              The <strong>Progress</strong> tab allows you to update completion percentages for each forest object in the project.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Select the project and week you want to report on</li>
              <li>Drag the slider or tap quick-buttons (0%, 25%, 50%, 75%, 100%) to set completion</li>
              <li>Add notes to explain progress or flag issues</li>
              <li>The overall "Project Completion" is calculated area-weighted across all objects</li>
              <li>Tap <Badge variant="outline" className="text-[10px] py-0 mx-1">Save Progress</Badge> to persist your changes</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              💡 Progress can be updated at any time, even before or after attendance submission.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="approvals" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              Report Approvals
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <p>
              The <strong>Approvals</strong> tab is for project managers and administrators to review submitted reports.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>View all weekly reports with status "submitted"</li>
              <li>Expand <Badge variant="outline" className="text-[10px] py-0 mx-1">Details</Badge> to see attendance entries and progress data</li>
              <li>Click <Badge className="text-[10px] py-0 mx-1 bg-primary">Approve</Badge> to finalize the report</li>
              <li>Click <Badge variant="outline" className="text-[10px] py-0 mx-1">Return</Badge> to send it back for corrections</li>
            </ul>
            <p className="mt-2">
              <strong>Who can approve?</strong> Project Managers, Org Admins, and Super Admins.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="roles" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Roles & Permissions
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0">Team Leader</Badge>
                <span>Records attendance, reports progress, submits weekly reports</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0">Project Manager</Badge>
                <span>Reviews and approves/returns reports; has full oversight</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0">Admin</Badge>
                <span>Full access to all projects and approval capabilities</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tips" className="border border-border/60 rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Tips & Best Practices
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-xs text-muted-foreground space-y-2">
            <ul className="list-disc pl-4 space-y-1">
              <li>Submit reports by Friday to ensure timely payroll processing</li>
              <li>Add notes for any anomalies (weather delays, sick leave, etc.)</li>
              <li>Update progress daily for accurate project tracking</li>
              <li>Use the Dashboard tab to see your submission statistics</li>
              <li>Check the Approvals tab if you're a manager — don't leave reports pending!</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Note */}
      <Card className="border-border/40 bg-muted/30">
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Need help? Contact your project manager or system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
