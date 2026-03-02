import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppLauncher, loadApps, type AppDefinition } from "@/components/dashboard/AppLauncher";
import { OrganizationPicker } from "@/components/dashboard/OrganizationPicker";
import { PendingApproval } from "@/components/auth/PendingApproval";
import { LoginProfileDialog } from "@/components/dashboard/LoginProfileDialog";
import { FeatureAnnouncementDialog, ANNOUNCEMENT_ID } from "@/components/dashboard/FeatureAnnouncementDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrg } from "@/contexts/OrgContext";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { logAuthEvent } from "@/lib/audit-helpers";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [apps, setApps] = useState<AppDefinition[]>(loadApps);
  const { role, loading: roleLoading, isAdmin } = useUserRole();
  const { orgId, loading: orgLoading } = useOrg();
  const [checkingPending, setCheckingPending] = useState(false);
  const [pendingChecked, setPendingChecked] = useState(false);

  // Login profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileChecked, setProfileChecked] = useState(() => !!sessionStorage.getItem("profile_dialog_shown"));

  // Feature announcement state
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementChecked, setAnnouncementChecked] = useState(() => !!sessionStorage.getItem("announcement_dismissed"));
  const authLoggedRef = useRef<string | null>(null); // dedupe guard for login audit

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
        setProfileChecked(false);
        setAnnouncementChecked(false);
        sessionStorage.removeItem("profile_dialog_shown");
        sessionStorage.removeItem("announcement_dismissed");
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        setPendingChecked(false);
        setProfileChecked(false);

        // Dedupe: only log once per unique session access_token
        const tokenKey = session.access_token?.slice(-16) ?? session.user.id;
        if (authLoggedRef.current !== tokenKey) {
          authLoggedRef.current = tokenKey;
          // Reliable awaited auth logging
          logAuthEvent("LOGIN", session.user.id, session.user.email, `${session.user.email} logged in`);
          supabase
            .from("profiles")
            .update({ last_sign_in_at: new Date().toISOString() })
            .eq("user_id", session.user.id)
            .then(({ error }) => { if (error) console.error("last_sign_in_at update failed:", error.message); });
        }
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

  // Check if we need to show the login profile dialog
  useEffect(() => {
    if (!session || !role || !orgId || profileChecked) return;
    
    supabase
      .from("profiles")
      .select("skip_login_profile")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => {
        const skip = (data as any)?.skip_login_profile ?? false;
        if (!skip) {
          setProfileDialogOpen(true);
        }
        setProfileChecked(true);
      });
  }, [session, role, orgId, profileChecked]);

  // Check if we need to show feature announcement
  useEffect(() => {
    if (!session || !role || !orgId || profileDialogOpen || announcementChecked) return;

    supabase
      .from("profiles")
      .select("dismissed_announcements")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => {
        const dismissed = (data as any)?.dismissed_announcements ?? [];
        if (!Array.isArray(dismissed) || !dismissed.includes(ANNOUNCEMENT_ID)) {
          setAnnouncementOpen(true);
        }
        setAnnouncementChecked(true);
      });
  }, [session, role, orgId, profileDialogOpen, announcementChecked]);

  if (loading || (session && roleLoading) || (session && !role && !pendingChecked) || (session && orgLoading)) {
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

  // Organization picker - show if no org selected
  if (!orgId) {
    return <OrganizationPicker onOrgSelected={() => {}} isAdmin={isAdmin} userEmail={session.user?.email} />;
  }

  // Login profile dialog
  if (profileDialogOpen) {
    return (
      <>
        <AppLauncher onLaunchApp={(appId) => setActiveApp(appId)} userRole={role} />
        <LoginProfileDialog
          open={profileDialogOpen}
          onContinue={() => { sessionStorage.setItem("profile_dialog_shown", "1"); setProfileDialogOpen(false); }}
          userId={session.user.id}
          userEmail={session.user.email ?? ""}
        />
      </>
    );
  }

  // Feature announcement dialog
  if (announcementOpen) {
    return (
      <>
        <AppLauncher onLaunchApp={(appId) => setActiveApp(appId)} userRole={role} />
        <FeatureAnnouncementDialog
          open={announcementOpen}
          onDismiss={() => setAnnouncementOpen(false)}
          userId={session.user.id}
        />
      </>
    );
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
