import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Building2, Phone, Mail, Globe, MapPin, Hash, User, Landmark, FileText } from "lucide-react";
import { CompanyFormDialog, type CompanyFormData } from "./CompanyFormDialog";
import { toast } from "sonner";
import { useUiLanguage } from "@/hooks/useUiLanguage";
import { useOrg } from "@/contexts/OrgContext";
import { Skeleton } from "@/components/ui/skeleton";

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

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

export function CompanyRegisterView() {
  const { t } = useUiLanguage();
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["companies", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!orgId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormData & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from("companies").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company details updated");
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {t("page.companyRegister.title")}{" "}
            <span className="text-muted-foreground font-normal text-lg">/ Företagsuppgifter</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Company details used in contracts and official documents.
          </p>
        </div>
        {company && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Edit Details
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !company ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No company details found for this organization.</p>
            <p className="text-xs mt-1">Company details are created automatically when an organization is set up.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Identity</h3>
              <div className="divide-y divide-border">
                <DetailRow icon={Building2} label="Company Name" value={company.name} />
                <DetailRow icon={Hash} label="Org. Number" value={company.org_number} />
                <DetailRow icon={FileText} label="Company Type" value={company.company_type} />
                <DetailRow icon={User} label="CEO / VD" value={company.ceo_name} />
                <DetailRow icon={Landmark} label="Bankgiro" value={company.bankgiro} />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Address */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Contact & Address</h3>
              <div className="divide-y divide-border">
                <DetailRow icon={MapPin} label="Address" value={[company.address, company.postcode, company.city].filter(Boolean).join(", ") || null} />
                <DetailRow icon={MapPin} label="Country" value={company.country} />
                <DetailRow icon={Phone} label="Phone" value={company.phone} />
                <DetailRow icon={Mail} label="Email" value={company.email} />
                <DetailRow icon={Globe} label="Website" value={company.website} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {company && (
        <CompanyFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={(data) => updateMutation.mutate({ ...data, id: company.id })}
          initialData={{
            ...company,
            org_number: company.org_number || "",
            address: company.address || "",
            postcode: company.postcode || "",
            city: company.city || "",
            phone: company.phone || "",
            email: company.email || "",
            country: company.country || "",
            website: company.website || "",
            bankgiro: company.bankgiro || "",
            ceo_name: company.ceo_name || "",
            company_type: company.company_type || "",
            id: company.id,
          }}
        />
      )}
    </div>
  );
}
