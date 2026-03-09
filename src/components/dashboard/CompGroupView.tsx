import { useState, useRef } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Trash2, Copy, Download, Upload, Search, RotateCcw,
  Lock, BarChart3, Settings2,
} from "lucide-react";
import { useCompGroupData } from "./comp-group/useCompGroupData";
import { GroupChips } from "./comp-group/GroupChips";
import { SlaClassTable } from "./comp-group/SlaClassTable";
import {
  NewGroupDialog, RenameGroupDialog, DeleteGroupDialog,
  DuplicateGroupDialog, CompareGroupsDialog, AddClassDialog,
  ManageTypesDialog,
} from "./comp-group/CompGroupDialogs";
import { SHOW_CLASS_OPTIONS } from "./comp-group/types";

export function CompGroupView() {
  const { orgId } = useOrg();
  const data = useCompGroupData(orgId);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);
  const [showClassCount, setShowClassCount] = useState(13);
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [clientForAll, setClientForAll] = useState("__none__");

  // Dialog state
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const [manageTypesGroupId, setManageTypesGroupId] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const activeGroup = data.groups.find(g => g.id === data.activeGroupId);

  // Dynamic show class options based on actual data
  const totalClasses = data.classes.length;
  const dynamicShowOptions = SHOW_CLASS_OPTIONS.map(opt => ({
    ...opt,
    label: opt.value === 13 ? `All (${totalClasses})` : opt.label,
  }));

  // Filter & limit classes
  let filteredClasses = search
    ? data.classes.filter(c =>
        c.sla_class_id.includes(search) ||
        c.type_label.toLowerCase().includes(search.toLowerCase()) ||
        c.client.toLowerCase().includes(search.toLowerCase())
      )
    : data.classes;

  if (showClassCount < 13 && !search) {
    filteredClasses = filteredClasses.slice(0, showClassCount);
  }

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroup) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split("\n");
        if (lines.length < 2) { toast.error("CSV file is empty or has no data rows"); return; }
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const slaIdx = headers.findIndex(h => h.includes("sla") || h.includes("class"));
        const typeIdx = headers.findIndex(h => h.includes("type"));
        const clientIdx = headers.findIndex(h => h.includes("client"));
        const s1Idx = headers.findIndex(h => h.includes("star 1") || h === "s1");
        const s2Idx = headers.findIndex(h => h.includes("star 2") || h === "s2");
        const s3Idx = headers.findIndex(h => h.includes("star 3") || h === "s3");
        const s4Idx = headers.findIndex(h => h.includes("star 4") || h === "s4");
        const s5Idx = headers.findIndex(h => h.includes("star 5") || h === "s5");
        const grossIdx = headers.findIndex(h => h.includes("gross"));
        const netIdx = headers.findIndex(h => h.includes("net"));

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim());
          if (cols.length < 2) continue;
          const slaId = slaIdx >= 0 ? cols[slaIdx].replace(/[^0-9]/g, "") : String(100 + i);
          await data.importClass({
            sla_class_id: slaId,
            type_label: typeIdx >= 0 ? cols[typeIdx] : "",
            client: clientIdx >= 0 ? cols[clientIdx] : "",
            star_1: s1Idx >= 0 ? Number(cols[s1Idx]) || 0 : 0,
            star_2: s2Idx >= 0 ? Number(cols[s2Idx]) || 0 : 0,
            star_3: s3Idx >= 0 ? Number(cols[s3Idx]) || 0 : 0,
            star_4: s4Idx >= 0 ? Number(cols[s4Idx]) || 0 : 0,
            star_5: s5Idx >= 0 ? Number(cols[s5Idx]) || 0 : 0,
            hourly_gross: grossIdx >= 0 ? Number(cols[grossIdx]) || 0 : 0,
            net_value: netIdx >= 0 ? Number(cols[netIdx]) || 0 : 0,
          });
          imported++;
        }
        toast.success(`Imported ${imported} classes`);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleApplyType = (typeLabel: string) => {
    setTypeFilter(typeLabel);
    if (typeLabel !== "__all__") data.applyTypeToAll(typeLabel);
  };

  const handleApplyClient = (client: string) => {
    setClientForAll(client);
    if (client !== "__none__") data.applyClientToAll(client);
  };

  const exportCsv = () => {
    if (data.classes.length === 0) return;
    const isPw = activeGroup?.method === "piecework";
    const headers = ["SLA Class", "Type", "Client", "Star 1", "Star 2", "Star 3", "Star 4", "Star 5", "Gross", ...(isPw ? ["Net"] : [])];
    const rows = data.classes.map(c => [c.sla_class_id, c.type_label, c.client, c.star_1, c.star_2, c.star_3, c.star_4, c.star_5, c.hourly_gross, ...(isPw ? [c.net_value] : [])].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comp-group-${activeGroup?.name || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (data.loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading compensation groups…</div>;
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compensation Group</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage compensation groups and pricing data</p>
      </div>

      {/* Groups Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Groups</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="outline" onClick={() => {
                setManageTypesGroupId(data.activeGroupId);
                setManageTypesOpen(true);
                data.fetchAllTypes();
              }}>
                <Settings2 className="w-4 h-4 mr-1" /> Manage Types
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLocked(!locked)}>
                <Lock className="w-4 h-4 mr-1" /> {locked ? "Unlock Cells" : "Lock Cells"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)}>
                <BarChart3 className="w-4 h-4 mr-1" /> Compare Groups
              </Button>
              <Button size="sm" onClick={() => setNewGroupOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Group
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDuplicateOpen(true)} disabled={!data.activeGroupId}>
                <Copy className="w-4 h-4 mr-1" /> Duplicate Group
              </Button>
            </div>
          </div>

          <GroupChips
            groups={data.groups}
            activeGroupId={data.activeGroupId}
            onSelect={id => { data.setActiveGroupId(id); setSelectedRows(new Set()); setTypeFilter("__all__"); setClientForAll("__none__"); }}
            onRename={(id, name) => { setRenameTargetId(id); setRenameValue(name); setRenameOpen(true); }}
            onDelete={id => { setDeleteTargetId(id); setDeleteGroupOpen(true); }}
          />
          <p className="text-xs text-muted-foreground mt-3">SLA = Service Level Agreement</p>
        </CardContent>
      </Card>

      {/* SLA Classes Card */}
      {activeGroup && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold mb-4">SLA Classes - {activeGroup.name}</h2>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Type for 101-113:</span>
                <Select value={typeFilter} onValueChange={handleApplyType}>
                  <SelectTrigger className="h-7 w-44 border-0 p-0 text-xs shadow-none">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">None</SelectItem>
                    {data.types.map(t => (
                      <SelectItem key={t.id} value={t.label}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Show classes:</span>
                <Select value={String(showClassCount)} onValueChange={v => setShowClassCount(Number(v))}>
                  <SelectTrigger className="h-7 w-28 border-0 p-0 text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOW_CLASS_OPTIONS.map(opt => (
                      <SelectItem key={opt.label} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Client for All:</span>
                <Select value={clientForAll} onValueChange={handleApplyClient}>
                  <SelectTrigger className="h-7 w-40 border-0 p-0 text-xs shadow-none">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {data.forestryClients.map(c => (
                      <SelectItem key={c} value={c}>{c}{c === "Standard Inc." ? " (Standard)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" variant="outline" onClick={data.resetDefaults}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset to Defaults
              </Button>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 w-44" />
              </div>

              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" disabled>
                  <Upload className="w-4 h-4 mr-1" /> Import CSV
                </Button>
                <Button size="sm" onClick={() => setAddClassOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Class
                </Button>
              </div>
            </div>

            {selectedRows.size > 0 && (
              <div className="flex gap-2 mb-4">
                <Button size="sm" variant="destructive" onClick={() => { data.deleteSelected(selectedRows); setSelectedRows(new Set()); }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete {selectedRows.size}
                </Button>
              </div>
            )}

            <SlaClassTable
              classes={filteredClasses}
              types={data.types}
              activeGroup={activeGroup}
              locked={locked}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              forestryClients={data.forestryClients}
              onUpdateField={(id, field, val) => { if (!locked) data.updateClassField(id, field, val); }}
              onUpdateType={(id, label) => { if (!locked) data.updateClassType(id, label); }}
              onUpdateClient={(id, client) => { if (!locked) data.updateClassClient(id, client); }}
              onDeleteClass={data.deleteClass}
            />
          </CardContent>
        </Card>
      )}

      {!activeGroup && data.groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Settings2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Compensation Groups</h2>
          <p className="text-muted-foreground max-w-md mb-4">Create your first compensation group to manage SLA class rates.</p>
          <Button onClick={() => setNewGroupOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Group
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <NewGroupDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} onCreate={data.createGroup} />

      <RenameGroupDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        initialName={renameValue}
        onRename={async (name) => { if (renameTargetId) await data.renameGroup(renameTargetId, name); }}
      />

      <DeleteGroupDialog
        open={deleteGroupOpen}
        onOpenChange={setDeleteGroupOpen}
        groupName={data.groups.find(g => g.id === deleteTargetId)?.name || ""}
        onDelete={async () => { if (deleteTargetId) await data.deleteGroup(deleteTargetId); }}
      />

      <DuplicateGroupDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        sourceGroupName={activeGroup?.name || ""}
        classCount={data.classes.length}
        onDuplicate={data.duplicateGroup}
      />

      <CompareGroupsDialog open={compareOpen} onOpenChange={setCompareOpen} groups={data.groups} />

      <AddClassDialog open={addClassOpen} onOpenChange={setAddClassOpen} onAdd={data.addClass} />

      <ManageTypesDialog
        open={manageTypesOpen}
        onOpenChange={setManageTypesOpen}
        groups={data.groups}
        allTypes={data.allTypes}
        selectedGroupId={manageTypesGroupId}
        onSelectGroup={setManageTypesGroupId}
        onAddType={data.addType}
        onDeleteType={data.deleteType}
        onUpdateType={data.updateType}
      />
    </div>
  );
}
