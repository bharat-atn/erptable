import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ForestryObjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  initialData?: any;
  projects: { id: string; name: string; project_id_display: string }[];
  loading?: boolean;
}

const SLA_CLASSES = [
  { value: "101", label: "101 – Easy" },
  { value: "103", label: "103 – Easy/Standard" },
  { value: "105", label: "105 – Standard" },
  { value: "107", label: "107 – Standard/Difficult" },
  { value: "109", label: "109 – Difficult" },
  { value: "111", label: "111 – Difficult/Extreme" },
  { value: "113", label: "113 – Extreme" },
];

const STATUSES = [
  { value: "registered", label: "Registered" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function ForestryObjectFormDialog({
  open, onOpenChange, onSubmit, initialData, projects, loading,
}: ForestryObjectFormDialogProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [slaClass, setSlaClass] = useState("standard");
  const [location, setLocation] = useState("");
  const [areaHectares, setAreaHectares] = useState("");
  const [status, setStatus] = useState("registered");
  const [coordinates, setCoordinates] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setProjectId(initialData.project_id || "");
      setSlaClass(initialData.sla_class || "standard");
      setLocation(initialData.location || "");
      setAreaHectares(initialData.area_hectares?.toString() || "");
      setStatus(initialData.status || "registered");
      setCoordinates(initialData.coordinates || "");
      setNotes(initialData.notes || "");
    } else {
      setName(""); setDescription(""); setProjectId(""); setSlaClass("standard");
      setLocation(""); setAreaHectares(""); setStatus("registered");
      setCoordinates(""); setNotes("");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      project_id: projectId,
      sla_class: slaClass,
      location: location.trim() || null,
      area_hectares: areaHectares ? parseFloat(areaHectares) : null,
      status,
      coordinates: coordinates.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Object" : "Add Object"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Project *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_id_display} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Parcel A – North Ridge" required />
            </div>
            <div>
              <Label>SLA Class</Label>
              <Select value={slaClass} onValueChange={setSlaClass}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLA_CLASSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ånge, Västernorrland" />
            </div>
            <div>
              <Label>Area (hectares)</Label>
              <Input type="number" step="0.01" min="0" value={areaHectares} onChange={(e) => setAreaHectares(e.target.value)} placeholder="e.g. 12.5" />
            </div>
            <div className="col-span-2">
              <Label>Coordinates</Label>
              <Input value={coordinates} onChange={(e) => setCoordinates(e.target.value)} placeholder="e.g. 62.3908° N, 15.6889° E" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim() || !projectId}>
              {loading ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
