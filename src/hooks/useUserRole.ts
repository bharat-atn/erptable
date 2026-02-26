import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = string;

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) { setRole(null); setLoading(false); }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!cancelled) {
        if (error || !data || data.length === 0) {
          setRole(null);
        } else {
          // Pick highest priority role
          const priority = ["admin", "org_admin", "hr_manager", "project_manager", "payroll_manager", "team_leader", "user"];
          const roles = data.map((r) => r.role as string);
          const best = priority.find((p) => roles.includes(p)) ?? roles[0];
          setRole(best);
        }
        setLoading(false);
      }
    }

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      fetchRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, isAdmin: role === "admin", isHR: role === "admin" || role === "org_admin" || role === "hr_manager" };
}
