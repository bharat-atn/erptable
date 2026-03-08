import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  Plus, Search, Pencil, Trash2, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

type SortKey = "client_number" | "company_name" | "contact_person" | "email" | "phone" | "address";
type SortDir = "asc" | "desc";

/* ─── Client Form Dialog ─────────────────────────────────── */

function ClientFormDialog({
  open, onOpenChange, onSubmit, initialData, loading, nextNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  initialData?: any;
  loading?: boolean;
  nextNumber?: string;
}) {
  const isEdit = !!initialData;
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  useState(() => {
    if (initialData) {
      setCompanyName(initialData.company_name || "");
      setContactPerson(initialData.contact_person || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setCity(initialData.city || "");
      setPostcode(initialData.postcode || "");
      setCountry(initialData.country || "");
      setStatus(initialData.status || "active");
      setNotes(initialData.notes || "");
    }
  });

  // Reset when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o && initialData) {
      setCompanyName(initialData.company_name || "");
      setContactPerson(initialData.contact_person || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setCity(initialData.city || "");
      setPostcode(initialData.postcode || "");
      setCountry(initialData.country || "");
      setStatus(initialData.status || "active");
      setNotes(initialData.notes || "");
    } else if (o && !initialData) {
      setCompanyName(""); setContactPerson(""); setEmail(""); setPhone("");
      setAddress(""); setCity(""); setPostcode(""); setCountry(""); setStatus("active"); setNotes("");
    }
    onOpenChange(o);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    onSubmit({
      company_name: companyName.trim(),
      contact_person: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: [address.trim(), city.trim(), postcode.trim()].filter(Boolean).join(", ") || null,
      city: city.trim() || null,
      postcode: postcode.trim() || null,
      country: country.trim() || null,
      status,
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && nextNumber && (
            <div>
              <Label className="text-muted-foreground text-xs">Client Number</Label>
              <p className="font-mono text-sm font-medium">{nextNumber}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Swedish Forestry Corporation" required />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g. Anders Svensson" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. anders@company.se" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +46 70 123 4567" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Skogsvägen 15" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Värmland" />
            </div>
            <div>
              <Label>Postcode</Label>
              <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. 123 45" />
            </div>
            <div className="col-span-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Sweden" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !companyName.trim()}>
              {loading ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main View ──────────────────────────────────────────── */

export function ClientRegisterView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("client_number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["forestry-clients", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_clients" as any)
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Auto-generate next client number
  const nextClientNumber = useMemo(() => {
    if (clients.length === 0) return "CT-0000";
    const nums = clients.map((c: any) => {
      const match = c.client_number?.match(/CT-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = Math.max(...nums);
    return `CT-${String(max + 1).padStart(4, "0")}`;
  }, [clients]);

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("forestry_clients" as any).insert({
        ...values,
        org_id: orgId,
        client_number: nextClientNumber,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-clients"] });
      toast.success("Client created");
      setFormOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { error } = await supabase.from("forestry_clients" as any).update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-clients"] });
      toast.success("Client updated");
      setEditClient(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forestry_clients" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-clients"] });
      toast.success("Client deleted");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 ml-1" /> : <ArrowDown className="w-3.5 h-3.5 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = clients.filter((c: any) => {
      const matchesSearch = !search || [c.company_name, c.client_number, c.contact_person, c.email, c.phone, c.address].some(
        (f) => f?.toLowerCase().includes(search.toLowerCase())
      );
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a: any, b: any) => {
      const aVal = (a[sortKey] || "").toString().toLowerCase();
      const bVal = (b[sortKey] || "").toString().toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, search, statusFilter, sortKey, sortDir]);

  // Build full address string
  const getAddress = (c: any) => {
    const parts = [c.address, c.city, c.postcode, c.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  // Export CSV
  const exportCsv = useCallback(() => {
    const headers = ["Client Number", "Company Name", "Contact Person", "Email", "Phone", "Address", "Status"];
    const rows = filtered.map((c: any) =>
      [c.client_number, c.company_name, c.contact_person || "", c.email || "", c.phone || "", getAddress(c), c.status].map(
        (v) => `"${String(v).replace(/"/g, '""')}"`
      ).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client-register.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [filtered]);

  const downloadTemplate = useCallback(() => {
    const headers = ["Company Name", "Contact Person", "Email", "Phone", "Address", "City", "Postcode", "Country"];
    const sample = ["Swedish Forestry AB", "Anders Svensson", "anders@company.se", "+46 70 123 4567", "Skogsvägen 15", "Östersund", "831 40", "Sweden"];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client-register-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client Register</h1>
        <p className="text-sm text-muted-foreground">Manage your client database</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1.5" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("CSV import coming soon")}>
            <Upload className="w-4 h-4 mr-1.5" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Client
          </Button>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {clients.length} clients
      </p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("client_number")}>
                  <span className="flex items-center">Client Number <SortIcon col="client_number" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("company_name")}>
                  <span className="flex items-center">Company Name <SortIcon col="company_name" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("contact_person")}>
                  <span className="flex items-center">Contact Person <SortIcon col="contact_person" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("email")}>
                  <span className="flex items-center">Email <SortIcon col="email" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("phone")}>
                  <span className="flex items-center">Phone <SortIcon col="phone" /></span>
                </TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No clients found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client: any) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm font-medium">{client.client_number}</TableCell>
                    <TableCell className="font-medium">{client.company_name}</TableCell>
                    <TableCell className="text-sm">{client.contact_person || "—"}</TableCell>
                    <TableCell className="text-sm">{client.email || "—"}</TableCell>
                    <TableCell className="text-sm">{client.phone || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[250px] truncate">{getAddress(client)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={client.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditClient(client)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(client)} title="Delete">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(v) => createMutation.mutate(v)}
        loading={createMutation.isPending}
        nextNumber={nextClientNumber}
      />

      {/* Edit dialog */}
      {editClient && (
        <ClientFormDialog
          open={!!editClient}
          onOpenChange={(open) => { if (!open) setEditClient(null); }}
          onSubmit={(v) => updateMutation.mutate({ id: editClient.id, ...v })}
          initialData={editClient}
          loading={updateMutation.isPending}
        />
      )}

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Client"
        itemName={deleteTarget?.company_name || ""}
        description={`Are you sure you want to delete "${deleteTarget?.company_name}"? This action cannot be undone.`}
      />
    </div>
  );
}
