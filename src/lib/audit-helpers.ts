import { supabase } from "@/integrations/supabase/client";

/**
 * Centralized sign-out that always logs a LOGOUT event before signing out.
 * Use this everywhere instead of raw supabase.auth.signOut().
 */
export async function logoutWithAudit(options?: { redirect?: string }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.rpc("log_auth_event", {
        _action: "LOGOUT",
        _user_id: session.user.id,
        _user_email: session.user.email ?? null,
        _summary: `${session.user.email} logged out`,
      });
    }
  } catch (err) {
    console.error("Failed to log LOGOUT event:", err);
  }
  await supabase.auth.signOut();
  if (options?.redirect) {
    window.location.href = options.redirect;
  }
}

/**
 * Log a reliable auth event (LOGIN). Awaits the RPC and logs errors.
 */
export async function logAuthEvent(
  action: string,
  userId: string,
  userEmail: string | null | undefined,
  summary?: string
) {
  try {
    const { error } = await supabase.rpc("log_auth_event", {
      _action: action,
      _user_id: userId,
      _user_email: userEmail ?? null,
      _summary: summary ?? `${userEmail ?? "unknown"} ${action.toLowerCase()}`,
    });
    if (error) console.error(`Audit log ${action} failed:`, error.message);
  } catch (err) {
    console.error(`Audit log ${action} exception:`, err);
  }
}
