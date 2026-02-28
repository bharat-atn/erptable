import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  logo_url: string | null;
  created_by: string | null;
  org_number: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  member_count?: number;
}

interface OrgContextType {
  orgId: string | null;
  orgName: string | null;
  orgType: string | null;
  orgs: Organization[];
  loading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  refreshOrgs: () => Promise<void>;
  clearOrg: () => void;
}

const OrgContext = createContext<OrgContextType>({
  orgId: null,
  orgName: null,
  orgType: null,
  orgs: [],
  loading: true,
  switchOrg: async () => {},
  refreshOrgs: async () => {},
  clearOrg: () => {},
});

export function useOrg() {
  return useContext(OrgContext);
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    () => sessionStorage.getItem("currentOrgId")
  );
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, slug, org_type, logo_url, created_by, org_number, address, postcode, city, country, phone, email, website");

    if (data && data.length > 0) {
      // Get member counts
      const { data: members } = await supabase
        .from("org_members")
        .select("org_id");

      const counts: Record<string, number> = {};
      members?.forEach((m: any) => {
        counts[m.org_id] = (counts[m.org_id] || 0) + 1;
      });

      const enriched = data.map((o: any) => ({
        ...o,
        member_count: counts[o.id] || 0,
      }));
      setOrgs(enriched);

      // Auto-select if only one org or if saved org still valid
      const savedId = sessionStorage.getItem("currentOrgId");
      if (savedId && enriched.some((o: Organization) => o.id === savedId)) {
        await setOrgContext(savedId);
      } else if (enriched.length === 1) {
        await setOrgContext(enriched[0].id);
      } else {
        setCurrentOrgId(null);
        sessionStorage.removeItem("currentOrgId");
      }
    }
    setLoading(false);
  }, []);

  const setOrgContext = async (orgId: string) => {
    // Set the Postgres session variable
    await supabase.rpc("set_org_context", { _org_id: orgId });
    setCurrentOrgId(orgId);
    sessionStorage.setItem("currentOrgId", orgId);
  };

  const switchOrg = useCallback(async (orgId: string) => {
    await setOrgContext(orgId);
  }, []);

  const clearOrg = useCallback(() => {
    setCurrentOrgId(null);
    sessionStorage.removeItem("currentOrgId");
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  return (
    <OrgContext.Provider
      value={{
        orgId: currentOrgId,
        orgName: currentOrg?.name ?? null,
        orgType: currentOrg?.org_type ?? null,
        orgs,
        loading,
        switchOrg,
        refreshOrgs: fetchOrgs,
        clearOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}
