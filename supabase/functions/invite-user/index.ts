import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  org_admin: "Admin",
  user: "Standard User",
  team_leader: "Team Leader",
  hr_manager: "HR Manager",
  project_manager: "Project Manager",
  payroll_manager: "Payroll Manager",
};

function buildInviteEmailHtml(userName: string, roleName: string, loginUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a1a1a; font-size: 22px; margin: 0;">You've Been Invited to ERP Table</h1>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">An administrator has invited you to join the system</p>
      </div>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Hi ${userName},
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        You have been invited to ERP Table with the role of <strong>${roleName}</strong>. Click the button below to sign in and get started.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" 
           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; 
                  padding: 14px 32px; text-decoration: none; border-radius: 6px; 
                  font-size: 15px; font-weight: 500;">
          Sign In Now
        </a>
      </div>

      <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #333; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">How to sign in:</p>
        <ul style="color: #555; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
          <li><strong>Google account?</strong> Click "Sign in with Google" — it's the fastest option.</li>
          <li><strong>Other email (iCloud, Outlook, etc.)?</strong> Click "Use email &amp; password instead", then click <strong>"Forgot password?"</strong> to set your own password.</li>
        </ul>
      </div>

      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${loginUrl}" style="color: #2563eb; word-break: break-all;">${loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        This is an automated invitation from ERP Table HR. If you did not expect this email, please disregard it.
      </p>
    </div>
  `;
}

async function sendInviteEmail(email: string, fullName: string, role: string, loginUrl: string): Promise<{ sent: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping invite email");
    return { sent: false, error: "Email service not configured" };
  }

  const roleName = ROLE_LABELS[role] || role;
  const displayName = fullName || email;
  const html = buildInviteEmailHtml(displayName, roleName, loginUrl);
  const plainText = `Hi ${displayName},\n\nYou have been invited to ERP Table with the role of ${roleName}. Sign in here: ${loginUrl}\n\nHow to sign in:\n- Google account? Click "Sign in with Google".\n- Other email? Click "Use email & password instead", then click "Forgot password?" to set your own password.\n\nThis is an automated invitation from ERP Table HR.`;

  try {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: "ERP Table HR <hr@mail.erptable.com>",
      reply_to: "hr@mail.erptable.com",
      to: [email],
      subject: `${displayName} — You're Invited to ERP Table`,
      html,
      text: plainText,
      headers: {
        "X-Entity-Ref-ID": `user-invite-${Date.now()}`,
      },
    });
    if (error) {
      console.error("Resend error:", error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { sent: false, error: err.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json();
    const { email, full_name, role, temp_password, app_access, resend_only, org_ids } = body;

    console.log("Invite user request:", { email, role, full_name, resend_only });

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Email and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    
    if (callerError || !caller) {
      console.error("Caller auth failed:", callerError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Caller:", caller.email);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      console.error("Caller is not admin:", caller.email);
      return new Response(JSON.stringify({ error: "Only admins can invite users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const loginUrl = `https://erptable.lovable.app?login_hint=${encodeURIComponent(email)}`;

    // ── Resend-only mode: just re-send the invite email ──
    if (resend_only) {
      const emailResult = await sendInviteEmail(email, full_name || email, role, loginUrl);
      
      // Audit log
      try {
        await adminClient.from("audit_log").insert({
          user_id: caller.id,
          user_email: caller.email,
          action: "INVITE_EMAIL_RESENT",
          table_name: "pending_role_assignments",
          record_id: email,
          summary: `Invite email resent to ${email} (${ROLE_LABELS[role] || role}) by ${caller.email}`,
          new_data: { email, role, full_name, email_sent: emailResult.sent },
        });
      } catch (e) {
        console.error("Audit log failed:", e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: emailResult.sent
            ? `Invite email resent to ${email}`
            : `Resend failed: ${emailResult.error}`,
          email_sent: emailResult.sent,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    let action: string;
    let emailResult = { sent: false, error: "not attempted" };

    if (existingUser) {
      // ── Existing auth user: update role directly ──
      userId = existingUser.id;
      console.log("Existing user found:", userId);

      // Remove other roles, then upsert the desired one
      await adminClient.from("user_roles").delete().eq("user_id", userId).neq("role", role);
      const { error: roleError } = await adminClient
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });

      if (roleError) {
        console.error("Role insert failed:", roleError.message);
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert profile to ensure it exists and is approved
      await adminClient
        .from("profiles")
        .upsert({
          user_id: userId,
          role: "approved",
          full_name: full_name || email,
          email,
        }, { onConflict: "user_id" });

      // Handle app access
      if (Array.isArray(app_access)) {
        await adminClient.from("user_app_access").delete().eq("user_id", userId);
        if (app_access.length > 0) {
          const rows = app_access.map((app_id: string) => ({
            user_id: userId,
            app_id,
            granted_by: caller.id,
          }));
          await adminClient.from("user_app_access").insert(rows);
        }
      }

      // Handle org memberships
      if (Array.isArray(org_ids) && org_ids.length > 0) {
        const orgRows = org_ids.map((oid: string) => ({
          org_id: oid,
          user_id: userId,
          role: "member",
        }));
        await adminClient.from("org_members").upsert(orgRows, { onConflict: "org_id,user_id" });
      }

      // Remove any pending assignment for this email
      await adminClient.from("pending_role_assignments").delete().eq("email", email.toLowerCase());

      action = "updated";

    } else if (temp_password) {
      // ── New user WITH fallback password: create auth user ──
      const password = temp_password;
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });

      if (createError || !newUser) {
        console.error("User creation failed:", createError?.message);
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
      console.log("New user created with password:", userId);

      await adminClient.from("user_roles").delete().eq("user_id", userId).neq("role", role);
      await adminClient.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
      await adminClient
        .from("profiles")
        .upsert({
          user_id: userId,
          role: "approved",
          full_name: full_name || email,
          email,
        }, { onConflict: "user_id" });

      if (Array.isArray(app_access)) {
        await adminClient.from("user_app_access").delete().eq("user_id", userId);
        if (app_access.length > 0) {
          const rows = app_access.map((app_id: string) => ({
            user_id: userId,
            app_id,
            granted_by: caller.id,
          }));
          await adminClient.from("user_app_access").insert(rows);
        }
      }

      // Handle org memberships
      if (Array.isArray(org_ids) && org_ids.length > 0) {
        const orgRows = org_ids.map((oid: string) => ({
          org_id: oid,
          user_id: userId,
          role: "member",
        }));
        await adminClient.from("org_members").upsert(orgRows, { onConflict: "org_id,user_id" });
      }

      action = "created";

    } else {
      // ── New user, NO password: store pending assignment ──
      const { error: pendingError } = await adminClient
        .from("pending_role_assignments")
        .upsert(
          {
            email: email.toLowerCase(),
            role,
            full_name: full_name || email,
            app_access: Array.isArray(app_access) ? app_access : [],
            org_ids: Array.isArray(org_ids) ? org_ids : [],
            invited_by: caller.id,
          },
          { onConflict: "email" }
        );

      if (pendingError) {
        console.error("Pending assignment failed:", pendingError.message);
        return new Response(JSON.stringify({ error: pendingError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = "pending";
      action = "invited";
      console.log("Pending role assignment stored for:", email);

      // Send invite email
      emailResult = await sendInviteEmail(email, full_name || email, role, loginUrl);
      console.log("Invite email result:", emailResult);
    }

    // Audit log
    try {
      await adminClient.from("audit_log").insert({
        user_id: caller.id,
        user_email: caller.email,
        action: "USER_INVITED",
        table_name: "user_roles",
        record_id: userId,
        summary: `User ${email} ${action} with role "${role}" by ${caller.email}${emailResult.sent ? " (email sent)" : ""}`,
        new_data: { email, role, full_name, action, app_access, email_sent: emailResult.sent },
      });
    } catch (auditErr) {
      console.error("Audit log insert failed:", auditErr);
    }

    console.log("Invite success:", email, action);

    const message = action === "invited"
      ? `Invitation stored for ${email} (role: ${role}). ${emailResult.sent ? "An invite email has been sent." : "They will be auto-approved when they first sign in."}`
      : `User ${email} ${action} with role ${role}.${temp_password && action === "created" ? " A fallback password was also set." : ""}`;

    return new Response(
      JSON.stringify({ success: true, user_id: userId, message, email_sent: emailResult.sent }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
