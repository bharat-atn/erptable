import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Thermometer, Umbrella, Baby, Clock, Loader2 } from "lucide-react";
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
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-sm text-muted-foreground">Ledighetsansökningar — Request and track time off</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Request
        </Button>
      </div>

      {/* Leave balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Umbrella className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">25</p>
            <p className="text-[10px] text-muted-foreground">Vacation Days</p>
            <p className="text-[10px] text-emerald-600 font-medium">25 remaining</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-[10px] text-muted-foreground">Comp Hours</p>
            <p className="text-[10px] text-muted-foreground">0 accrued</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Thermometer className="w-5 h-5 mx-auto text-rose-600 mb-1" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-[10px] text-muted-foreground">Sick Days Used</p>
            <p className="text-[10px] text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests list */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm mb-4">My Requests</h3>
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No leave requests</p>
            <p className="text-xs text-muted-foreground mt-1">Submit a request to get started</p>
          </div>
        </CardContent>
      </Card>

      {/* New Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Leave Request — Ledighetsansökan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Leave Type — Typ</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="date" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Reason — Anledning</Label>
              <Textarea placeholder="Optional..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
