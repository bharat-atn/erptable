import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { CompanyFormDialog, type CompanyFormData } from "./CompanyFormDialog";
import { toast } from "sonner";
import { SortableTable, type ColumnDef } from "@/components/ui/sortable-table";

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
}

const columns: ColumnDef<Company>[] = [
  { key: "name", header: "Employer / Arbetsgivare", accessor: (c) => c.name, render: (c) => <span className="font-medium text-sm">{c.name}</span> },
  { key: "org_number", header: "Org. Number", accessor: (c) => c.org_number, className: "text-sm" },
  { key: "city", header: "City / Ort", accessor: (c) => c.city, className: "text-sm" },
  { key: "country", header: "Country", accessor: (c) => c.country, className: "text-sm text-muted-foreground" },
  { key: "phone", header: "Phone", accessor: (c) => c.phone, className: "text-sm text-muted-foreground" },
  { key: "email", header: "Email", accessor: (c) => c.email, className: "text-sm text-muted-foreground" },
];

export function CompanyRegisterView() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState("");

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
        const { error } = await supabase.from("companies").insert(company);
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
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = companies.filter((c) => {
    const term = search.toLowerCase();
    return c.name?.toLowerCase().includes(term) || c.org_number?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) || c.country?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Company Register{" "}
            <span className="text-muted-foreground font-normal text-lg">/ Företagsregister</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage employer companies used in contracts</p>
        </div>
        <Button onClick={() => { setEditingCompany(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Company
        </Button>
      </div>

      <div className="relative w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <SortableTable<Company>
            data={filtered}
            columns={columns}
            rowKey={(c) => c.id}
            defaultSortKey="name"
            isLoading={isLoading}
            emptyMessage="No companies registered yet."
            rowActions={(c) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditingCompany(c); setDialogOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </CardContent>
      </Card>

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCompany(null); }}
        onSubmit={(data) => upsertMutation.mutate(editingCompany ? { ...data, id: editingCompany.id } : data)}
        initialData={editingCompany}
      />
    </div>
  );
}
