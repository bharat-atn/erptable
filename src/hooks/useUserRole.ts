import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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
          const priority: AppRole[] = ["admin", "hr_admin", "hr_staff", "user"];
          const roles = data.map((r) => r.role);
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

  return { role, loading, isAdmin: role === "admin", isHR: role === "admin" || role === "hr_admin" || role === "hr_staff" };
}
