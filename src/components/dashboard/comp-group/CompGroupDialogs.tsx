import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { CompGroup, CompGroupType } from "./types";
import { ALL_SLA_IDS } from "./types";

/* ---- New Group Dialog ---- */
interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (name: string, category: string, method: string) => Promise<any>;
}

export function NewGroupDialog({ open, onOpenChange, onCreate }: NewGroupDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("clearing");
  const [method, setMethod] = useState("hourly");

  const handleCreate = async () => {
    await onCreate(name.trim(), category, method);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Compensation Group</DialogTitle>
          <DialogDescription>Create a new group to manage SLA class compensation rates.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Comp. group clearing hourly salary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clearing">Clearing</SelectItem>
                  <SelectItem value="planting">Planting</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Salary</SelectItem>
                  <SelectItem value="piecework">Piece Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Rename Group Dialog ---- */
interface RenameGroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
  onRename: (name: string) => Promise<void>;
}

export function RenameGroupDialog({ open, onOpenChange, initialName, onRename }: RenameGroupDialogProps) {
  const [name, setName] = useState(initialName);

  // Sync when dialog opens with new name
  if (open && name !== initialName && !name) setName(initialName);

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setName(""); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Group</DialogTitle>
          <DialogDescription>Enter a new name for this compensation group.</DialogDescription>
        </DialogHeader>
        <Input value={name || initialName} onChange={e => setName(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onRename(name.trim() || initialName); onOpenChange(false); setName(""); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Delete Group Confirm ---- */
interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupName: string;
  onDelete: () => Promise<void>;
}

export function DeleteGroupDialog({ open, onOpenChange, groupName, onDelete }: DeleteGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
          <DialogDescription>
            This will permanently delete "{groupName}" and all its classes. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onDelete(); onOpenChange(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Duplicate Group Dialog ---- */
interface DuplicateGroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceGroupName: string;
  classCount: number;
  onDuplicate: (name: string) => Promise<void>;
}

export function DuplicateGroupDialog({ open, onOpenChange, sourceGroupName, classCount, onDuplicate }: DuplicateGroupDialogProps) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setName(""); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate: {sourceGroupName}</DialogTitle>
          <DialogDescription>Create a copy of this group with all its classes and types.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">New Group Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name for duplicated group" />
          </div>
          <p className="text-sm text-muted-foreground">
            This will create a new group with all {classCount} classes copied from "{sourceGroupName}".
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onDuplicate(name.trim()); onOpenChange(false); setName(""); }} disabled={!name.trim()}>Duplicate Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Compare Groups Dialog ---- */
interface CompareGroupsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: CompGroup[];
}

export function CompareGroupsDialog({ open, onOpenChange, groups }: CompareGroupsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setSelected(new Set()); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compare Groups</DialogTitle>
          <DialogDescription>Select groups to compare side by side.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {groups.map(g => (
            <label key={g.id} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selected.has(g.id)}
                onCheckedChange={v => {
                  const next = new Set(selected);
                  if (v) next.add(g.id); else next.delete(g.id);
                  setSelected(next);
                }}
              />
              <span className="text-sm">{g.name}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button disabled={selected.size < 2}>Compare {selected.size} Groups</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Add Class Dialog ---- */
interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (slaClassId: string) => Promise<void>;
}

export function AddClassDialog({ open, onOpenChange, onAdd }: AddClassDialogProps) {
  const [slaId, setSlaId] = useState("104");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add SLA Class</DialogTitle>
          <DialogDescription>Select the SLA class ID to add to this group.</DialogDescription>
        </DialogHeader>
        <Select value={slaId} onValueChange={setSlaId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_SLA_IDS.map(id => (
              <SelectItem key={id} value={id}>SLA Class {id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onAdd(slaId); onOpenChange(false); }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Manage Types Dialog ---- */
interface ManageTypesDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: CompGroup[];
  allTypes: CompGroupType[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onAddType: (groupId: string, label: string) => Promise<void>;
  onDeleteType: (id: string) => Promise<void>;
  onUpdateType: (id: string, label: string) => Promise<void>;
}

export function ManageTypesDialog({
  open, onOpenChange, groups, allTypes, selectedGroupId,
  onSelectGroup, onAddType, onDeleteType, onUpdateType,
}: ManageTypesDialogProps) {
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const group = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
  const groupTypes = selectedGroupId ? allTypes.filter(t => t.group_id === selectedGroupId) : [];
  const methodLabel = group?.method === "piecework" ? "Piece Work" : "Hourly Salary";

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setEditingId(null); setEditingLabel(""); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Compensation Types</DialogTitle>
          <DialogDescription>Define compensation types for each group.</DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-sm font-medium">Select Compensation Group</label>
          <Select value={selectedGroupId || "__select__"} onValueChange={v => { if (v !== "__select__") onSelectGroup(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__select__" disabled>Select group…</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {group && (
          <>
            <div className="bg-muted/50 rounded-md px-4 py-2">
              <h3 className="text-sm font-semibold">{methodLabel} Types ({groupTypes.length})</h3>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {groupTypes.map((t, idx) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 border rounded-md">
                  <div className="flex-1 min-w-0">
                    {editingId === t.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingLabel}
                          onChange={e => setEditingLabel(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === "Enter") { onUpdateType(t.id, editingLabel); setEditingId(null); }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button size="sm" onClick={() => { onUpdateType(t.id, editingLabel); setEditingId(null); }}>Save</Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Type {idx + 1}</span>
                          <span className="text-sm font-semibold">{t.label}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{methodLabel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(t.id); setEditingLabel(t.label); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDeleteType(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {groupTypes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No types defined yet.</p>}
            </div>

            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder={`e.g. ${group.category === "clearing" ? "Clearing" : "Planting"} Type ${groupTypes.length + 1} (${methodLabel})`}
                className="flex-1"
                onKeyDown={e => {
                  if (e.key === "Enter" && newLabel.trim()) {
                    onAddType(selectedGroupId!, newLabel.trim());
                    setNewLabel("");
                  }
                }}
              />
              <Button onClick={() => { onAddType(selectedGroupId!, newLabel.trim()); setNewLabel(""); }} disabled={!newLabel.trim()} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            <div className="bg-accent/50 border border-border rounded-md px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Each compensation group has its own set of types. Define rates specific to each group's compensation structure.
              </p>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
