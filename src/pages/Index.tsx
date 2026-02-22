import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppLauncher, loadApps, type AppDefinition } from "@/components/dashboard/AppLauncher";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [apps, setApps] = useState<AppDefinition[]>(loadApps);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) setActiveApp(null);

      // Log auth events to audit log
      if (event === "SIGNED_IN" && session?.user) {
        supabase.rpc("log_auth_event", {
          _action: "LOGIN",
          _user_id: session.user.id,
          _user_email: session.user.email ?? null,
          _summary: `${session.user.email} logged in`,
        }).then();
      } else if (event === "SIGNED_OUT") {
        // We don't have session here, but we stored it before
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm onSuccess={() => {}} />;
  }

  if (!activeApp) {
    return <AppLauncher onLaunchApp={(appId) => setActiveApp(appId)} />;
  }

  return (
    <Dashboard
      onBackToLauncher={() => setActiveApp(null)}
      appId={activeApp}
      apps={apps}
      onSwitchApp={(id) => setActiveApp(id)}
    />
  );
};

export default Index;
