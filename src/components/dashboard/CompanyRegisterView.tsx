import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CompanyFormDialog, type CompanyFormData } from "./CompanyFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "sonner";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";
import { useUiLanguage } from "@/hooks/useUiLanguage";

interface Company {
  id: string;
  name: string;
  org_number: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  website: string | null;
  bankgiro: string | null;
  ceo_name: string | null;
  company_type: string | null;
}

const columns: ColumnDef<Company>[] = [
  {
    key: "name", header: "Employer / Arbetsgivare", accessor: (c) => c.name, hideable: false,
    render: (c, hl) => <span className="font-medium text-sm">{hl?.(c.name) ?? c.name}</span>,
  },
  { key: "org_number", header: "Org. Number", accessor: (c) => c.org_number, render: (c, hl) => <span className="text-sm">{hl?.(c.org_number || "—") ?? c.org_number ?? "—"}</span> },
  { key: "city", header: "City / Ort", accessor: (c) => c.city, render: (c, hl) => <span className="text-sm">{hl?.(c.city || "—") ?? c.city ?? "—"}</span> },
  { key: "country", header: "Country", accessor: (c) => c.country, render: (c, hl) => <span className="text-sm text-muted-foreground">{hl?.(c.country || "—") ?? c.country ?? "—"}</span> },
  { key: "phone", header: "Phone", accessor: (c) => c.phone, render: (c, hl) => <span className="text-sm text-muted-foreground">{hl?.(c.phone || "—") ?? c.phone ?? "—"}</span> },
  { key: "email", header: "Email", accessor: (c) => c.email, render: (c, hl) => <span className="text-sm text-muted-foreground">{hl?.(c.email || "—") ?? c.email ?? "—"}</span> },
  { key: "website", header: "Website", accessor: (c) => c.website, defaultVisible: false, render: (c, hl) => <span className="text-sm text-muted-foreground">{hl?.(c.website || "—") ?? c.website ?? "—"}</span> },
  { key: "address", header: "Address", accessor: (c) => c.address, defaultVisible: false, render: (c, hl) => <span className="text-sm text-muted-foreground">{hl?.(c.address || "—") ?? c.address ?? "—"}</span> },
  { key: "postcode", header: "Postcode", accessor: (c) => c.postcode, defaultVisible: false, className: "text-sm text-muted-foreground" },
];

export function CompanyRegisterView() {
  const { t } = useUiLanguage();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (company: CompanyFormData & { id?: string }) => {
      if (company.id) {
        const { error } = await supabase.from("companies").update(company).eq("id", company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert(company as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(editingCompany ? "Company updated" : "Company added");
      setDialogOpen(false);
      setEditingCompany(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("foreign key") || msg.includes("still referenced")) {
        toast.error("Cannot delete this company — it is linked to one or more contracts. Remove or reassign those contracts first.");
      } else {
        toast.error(msg);
      }
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {t("page.companyRegister.title")}{" "}
            <span className="text-muted-foreground font-normal text-lg">/ Företagsregister</span>
          </h1>
          <p className="text-muted-foreground text-sm">{t("page.companyRegister.desc")}</p>
        </div>
        <Button onClick={() => { setEditingCompany(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> {t("action.addCompany")}
        </Button>
      </div>

      <EnhancedTable<Company>
        data={companies}
        columns={columns}
        rowKey={(c) => c.id}
        defaultSortKey="name"
        isLoading={isLoading}
        emptyMessage="No companies registered yet."
        searchPlaceholder="Search companies by name, org number, city..."
        enableColumnToggle
        enableDenseToggle
        enableHighlight
        stickyHeader
        onRowClick={(c) => { setEditingCompany(c); setDialogOpen(true); }}
        rowActions={(c) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditingCompany(c); setDialogOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCompany(null); }}
        onSubmit={(data) => upsertMutation.mutate(editingCompany ? { ...data, id: editingCompany.id } : data)}
        initialData={editingCompany ? { ...editingCompany, bankgiro: (editingCompany as any).bankgiro || "", ceo_name: (editingCompany as any).ceo_name || "", company_type: (editingCompany as any).company_type || "" } : null}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Company"
        itemName={deleteTarget?.name || ""}
        description="This company will be removed from the register. Any contracts referencing this company may be affected."
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
