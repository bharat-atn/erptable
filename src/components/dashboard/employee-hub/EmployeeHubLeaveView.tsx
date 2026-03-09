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
    <div className="space-y-4 px-2 pt-2 pb-24 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leave Requests</h1>
            <p className="text-sm text-white/80">Ledighetsansökningar</p>
          </div>
          <button onClick={() => setDialogOpen(true)} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Leave balance cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-blue-600/20 p-4 text-center shadow-sm">
          <Umbrella className="w-6 h-6 mx-auto text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-600">25</p>
          <p className="text-[9px] text-muted-foreground leading-tight mt-1">Vacation Days</p>
          <p className="text-[9px] text-blue-600 font-semibold">25 left</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-4 text-center shadow-sm">
          <Clock className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">0</p>
          <p className="text-[9px] text-muted-foreground leading-tight mt-1">Comp Hours</p>
          <p className="text-[9px] text-muted-foreground">0 accrued</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-rose-600/20 p-4 text-center shadow-sm">
          <Thermometer className="w-6 h-6 mx-auto text-rose-600 mb-2" />
          <p className="text-2xl font-bold text-rose-600">0</p>
          <p className="text-[9px] text-muted-foreground leading-tight mt-1">Sick Days</p>
          <p className="text-[9px] text-muted-foreground">This year</p>
        </div>
      </div>

      {/* Requests list */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4 text-emerald-700 dark:text-emerald-500">My Requests</h3>
        <div className="text-center py-10">
          <Calendar className="w-12 h-12 text-emerald-600/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No leave requests</p>
          <p className="text-xs text-muted-foreground mt-1">Submit a request to get started</p>
        </div>
      </div>

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
