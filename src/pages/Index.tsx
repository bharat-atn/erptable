import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppLauncher, loadApps, type AppDefinition } from "@/components/dashboard/AppLauncher";
import { PendingApproval } from "@/components/auth/PendingApproval";
import { useUserRole } from "@/hooks/useUserRole";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [apps, setApps] = useState<AppDefinition[]>(loadApps);
  const { role, loading: roleLoading } = useUserRole();
  const [checkingPending, setCheckingPending] = useState(false);
  const [pendingChecked, setPendingChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        setActiveApp(null);
        setPendingChecked(false);
      }

      if (event === "SIGNED_IN" && session?.user) {
        setPendingChecked(false);
        supabase.rpc("log_auth_event", {
          _action: "LOGIN",
          _user_id: session.user.id,
          _user_email: session.user.email ?? null,
          _summary: `${session.user.email} logged in`,
        }).then();

        supabase
          .from("profiles")
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq("user_id", session.user.id)
          .then();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Safety net: check pending role assignment when user has session but no role
  useEffect(() => {
    if (!session || roleLoading || role || pendingChecked || checkingPending) return;

    setCheckingPending(true);
    supabase.functions
      .invoke("check-pending-role")
      .then(({ data, error }) => {
        if (!error && data?.role) {
          // Role was assigned — force a page reload to re-fetch everything
          window.location.reload();
        } else {
          setPendingChecked(true);
        }
      })
      .catch(() => {
        setPendingChecked(true);
      })
      .finally(() => {
        setCheckingPending(false);
      });
  }, [session, roleLoading, role, pendingChecked, checkingPending]);

  if (loading || (session && roleLoading) || (session && !role && !pendingChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm onSuccess={() => {}} />;
  }

  if (!role) {
    return <PendingApproval />;
  }

  if (!activeApp) {
    return <AppLauncher onLaunchApp={(appId) => setActiveApp(appId)} userRole={role} />;
  }

  return (
    <Dashboard
      onBackToLauncher={() => setActiveApp(null)}
      appId={activeApp}
      apps={apps}
      onSwitchApp={(id) => setActiveApp(id)}
      userRole={role}
    />
  );
};

export default Index;
