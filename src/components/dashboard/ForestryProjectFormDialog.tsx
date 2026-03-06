import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectFormData {
  name: string;
  description: string;
  type: string;
  status: string;
  location: string;
  client: string;
  start_date: string;
  end_date: string;
  budget: string;
}

interface ForestryProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => void;
  initialData?: Partial<ProjectFormData> | null;
  loading?: boolean;
}

const defaultData: ProjectFormData = {
  name: "", description: "", type: "clearing", status: "setup",
  location: "", client: "", start_date: "", end_date: "", budget: "0",
};

export function ForestryProjectFormDialog({ open, onOpenChange, onSubmit, initialData, loading }: ForestryProjectFormDialogProps) {
  const [form, setForm] = useState<ProjectFormData>(defaultData);
  const isEdit = !!initialData?.name;

  useEffect(() => {
    if (open) setForm(initialData ? { ...defaultData, ...initialData } : defaultData);
  }, [open, initialData]);

  const set = (key: keyof ProjectFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Project Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sundsvall North Clearing" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clearing">Clearing</SelectItem>
                  <SelectItem value="planting">Planting</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="payroll_ready">Payroll Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Sundsvall" />
            </div>
            <div className="grid gap-1.5">
              <Label>Client</Label>
              <Input value={form.client} onChange={(e) => set("client", e.target.value)} placeholder="e.g. SCA Skog" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Budget (SEK)</Label>
              <Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} disabled={!form.name.trim() || loading}>
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
