import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Thermometer, Umbrella, Baby, Clock } from "lucide-react";
import { toast } from "sonner";

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave", labelSv: "Sjukfrånvaro", icon: Thermometer },
  { value: "vacation", label: "Vacation", labelSv: "Semester", icon: Umbrella },
  { value: "parental", label: "Parental Leave", labelSv: "Föräldraledighet", icon: Baby },
  { value: "vab", label: "VAB (Child sick)", labelSv: "VAB", icon: Baby },
  { value: "comp_time", label: "Comp Time", labelSv: "Komptid", icon: Clock },
];

export function EmployeeHubLeaveView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("vacation");

  const handleSubmit = () => {
    toast.success("Leave request submitted for approval");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4 px-1 pt-3 pb-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between px-2 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Leave Requests</h1>
          <p className="text-xs text-muted-foreground">Ledighetsansökningar</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-10 shrink-0">
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>

      {/* Leave balance cards */}
      <div className="grid grid-cols-3 gap-2 px-2">
        <Card className="border-border/60">
          <CardContent className="pt-3 pb-3 text-center px-2">
            <Umbrella className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-xl font-bold">25</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Vacation Days</p>
            <p className="text-[9px] text-emerald-600 font-medium">25 left</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-3 pb-3 text-center px-2">
            <Clock className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-xl font-bold">0</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Comp Hours</p>
            <p className="text-[9px] text-muted-foreground">0 accrued</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-3 pb-3 text-center px-2">
            <Thermometer className="w-5 h-5 mx-auto text-rose-600 mb-1" />
            <p className="text-xl font-bold">0</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Sick Days</p>
            <p className="text-[9px] text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests list */}
      <Card className="border-border/60 mx-2">
        <CardContent className="pt-5 pb-5">
          <h3 className="font-semibold text-sm mb-4">My Requests</h3>
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No leave requests</p>
            <p className="text-xs text-muted-foreground mt-1">Submit a request to get started</p>
          </div>
        </CardContent>
      </Card>

      {/* New Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">New Leave Request — Ledighetsansökan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Leave Type — Typ</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.labelSv} ({t.label})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" className="h-11" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" className="h-11" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Reason — Anledning</Label>
              <Textarea placeholder="Optional..." rows={2} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="h-12 sm:h-10" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="h-12 sm:h-10" onClick={handleSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
