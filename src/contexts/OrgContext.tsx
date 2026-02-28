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

  const setOrgContext = async (orgId: string) => {
    await supabase.rpc("set_org_context", { _org_id: orgId });
    setCurrentOrgId(orgId);
    sessionStorage.setItem("currentOrgId", orgId);
  };

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      // Check auth session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setOrgs([]);
        setCurrentOrgId(null);
        sessionStorage.removeItem("currentOrgId");
        return;
      }

      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, org_type, logo_url, created_by, org_number, address, postcode, city, country, phone, email, website");

      if (!data || data.length === 0) {
        setOrgs([]);
        return;
      }

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

      // Check if user is super admin
      const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

      const savedId = sessionStorage.getItem("currentOrgId");

      if (isSuperAdmin) {
        // Super admins bypass picker — auto-select saved or first org
        if (savedId && enriched.some((o: Organization) => o.id === savedId)) {
          await setOrgContext(savedId);
        } else if (enriched.length > 0) {
          await setOrgContext(enriched[0].id);
        }
      } else {
        // Non-super-admins: only restore saved org, otherwise force picker
        if (savedId && enriched.some((o: Organization) => o.id === savedId)) {
          await setOrgContext(savedId);
        } else {
          setCurrentOrgId(null);
          sessionStorage.removeItem("currentOrgId");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const switchOrg = useCallback(async (orgId: string) => {
    await setOrgContext(orgId);
  }, []);

  const clearOrg = useCallback(() => {
    setCurrentOrgId(null);
    sessionStorage.removeItem("currentOrgId");
  }, []);

  useEffect(() => {
    fetchOrgs();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchOrgs();
      } else if (event === "SIGNED_OUT") {
        setOrgs([]);
        setCurrentOrgId(null);
        sessionStorage.removeItem("currentOrgId");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
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
