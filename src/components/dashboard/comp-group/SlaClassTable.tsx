import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Trash2 } from "lucide-react";
import type { CompGroupClass, CompGroupType, CompGroup } from "./types";

interface SlaClassTableProps {
  classes: CompGroupClass[];
  types: CompGroupType[];
  activeGroup: CompGroup;
  locked: boolean;
  selectedRows: Set<string>;
  setSelectedRows: (rows: Set<string>) => void;
  forestryClients: string[];
  onUpdateField: (classId: string, field: string, value: number) => void;
  onUpdateType: (classId: string, typeLabel: string) => void;
  onUpdateClient: (classId: string, client: string) => void;
  onDeleteClass: (id: string) => void;
}

export function SlaClassTable({
  classes, types, activeGroup, locked, selectedRows, setSelectedRows,
  forestryClients, onUpdateField, onUpdateType, onUpdateClient, onDeleteClass,
}: SlaClassTableProps) {
  const isPiecework = activeGroup.method === "piecework";
  const isClearing = activeGroup.category === "clearing";

  const starGroupLabel = isPiecework
    ? (isClearing ? "Clearing units/day" : "Planting units/hr")
    : "Hourly salary";
  const grossLabel = isPiecework
    ? (isClearing ? "Clear Gross" : "Plant Gross")
    : "Hourly Gross";
  const netLabel = isPiecework
    ? (isClearing ? "Clear Net" : "Plant Net")
    : null;

  const allSelected = classes.length > 0 && classes.every(c => selectedRows.has(c.id));

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={v => {
                  if (v) setSelectedRows(new Set(classes.map(c => c.id)));
                  else setSelectedRows(new Set());
                }}
              />
            </TableHead>
            <TableHead className="w-32">SLA Class ID</TableHead>
            <TableHead className="w-52">Type</TableHead>
            <TableHead className="w-32">Client</TableHead>
            <TableHead colSpan={5} className="text-center border-l">
              <span className="font-semibold">{starGroupLabel}</span>
            </TableHead>
            <TableHead className="w-28 text-center">{grossLabel}</TableHead>
            {netLabel && <TableHead className="w-28 text-center">{netLabel}</TableHead>}
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
          <TableRow>
            <TableHead />
            <TableHead />
            <TableHead />
            <TableHead />
            {[1,2,3,4,5].map(s => (
              <TableHead key={s} className="text-center border-l w-24">
                <span className="inline-flex items-center gap-0.5 text-xs">
                  {s}<Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
              </TableHead>
            ))}
            <TableHead />
            {netLabel && <TableHead />}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={netLabel ? 12 : 11} className="text-center text-muted-foreground py-8">
                No classes added yet. Click "+ Add Class" to begin.
              </TableCell>
            </TableRow>
          ) : classes.map(cls => {
            const isHighlighted = cls.sla_class_id === "107";
            return (
              <TableRow key={cls.id} className={isHighlighted ? "bg-accent/50 border-y-2 border-primary/20" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(cls.id)}
                    onCheckedChange={v => {
                      const next = new Set(selectedRows);
                      if (v) next.add(cls.id); else next.delete(cls.id);
                      setSelectedRows(next);
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">SLA Class {cls.sla_class_id}</TableCell>
                <TableCell>
                  {locked ? (
                    <span className="text-sm text-muted-foreground">
                      {cls.type_label ? `${cls.type_label} (${isPiecework ? "Piece Work" : "Hourly Salary"})` : "—"}
                    </span>
                  ) : (
                    <Select
                      value={cls.type_label || "__none__"}
                      onValueChange={v => onUpdateType(cls.id, v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {types.map(t => (
                          <SelectItem key={t.id} value={t.label.split(" (")[0]}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {locked ? (
                    <span className="text-sm">{cls.client || "—"}</span>
                  ) : (
                    <Select
                      value={cls.client || "__empty__"}
                      onValueChange={v => onUpdateClient(cls.id, v === "__empty__" ? "" : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">—</SelectItem>
                        {forestryClients.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                {([1,2,3,4,5] as const).map(star => {
                  const field = `star_${star}` as keyof CompGroupClass;
                  const val = cls[field] as number;
                  return (
                    <TableCell key={star} className="text-center border-l">
                      {locked ? (
                        <span className="text-sm">{val.toFixed(2)}</span>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={val}
                          onChange={e => onUpdateField(cls.id, field, Number(e.target.value))}
                          className="h-8 w-20 text-center text-xs mx-auto"
                        />
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  {locked ? (
                    <span className="text-sm font-semibold">{cls.hourly_gross.toFixed(2)}</span>
                  ) : (
                    <Input
                      type="number" step="0.01" value={cls.hourly_gross}
                      onChange={e => onUpdateField(cls.id, "hourly_gross", Number(e.target.value))}
                      className="h-8 w-24 text-center text-xs mx-auto font-semibold"
                    />
                  )}
                </TableCell>
                {netLabel && (
                  <TableCell className="text-center">
                    {locked ? (
                      <span className="text-sm font-semibold">{cls.net_value.toFixed(2)}</span>
                    ) : (
                      <Input
                        type="number" step="0.01" value={cls.net_value}
                        onChange={e => onUpdateField(cls.id, "net_value", Number(e.target.value))}
                        className="h-8 w-24 text-center text-xs mx-auto font-semibold"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDeleteClass(cls.id)} disabled={locked}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
