import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  LogOut,
  Layers,
  Briefcase,
  BookOpen,
  Building2,
  GripVertical,
  Monitor,
  LayoutGrid,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronDown,
  Settings,
  HeadphonesIcon,
  BadgeCheck,
  X,
  ChevronsUpDown,
  Check,
  GitBranch,
  Tag,
  Calendar,
  Clock,
  FlaskConical,
  Camera,
  Globe,
  Lock,
  Loader2,
  AlertTriangle,
  FolderKanban,
  BarChart3,
   TreePine,
   MapPin,
   FileSpreadsheet } from
"lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logoutWithAudit } from "@/lib/audit-helpers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type AppDefinition, getIcon, getColor, isPublishedEnvironment } from "./AppLauncher";
import { toast } from "sonner";
import ljunganLogo from "@/assets/ljungan-forestry-logo.png";
import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { useUiLanguage } from "@/hooks/useUiLanguage";
import { LANGUAGE_OPTIONS, type UiLang } from "@/lib/ui-translations";
import { Separator } from "@/components/ui/separator";
import { parsePhone, getOrderedCountries, getIsoDateFormat, combinePhone, formatDateForDisplay, parseDateToCanonical } from "@/lib/profile-utils";
import { DEFAULT_SIDEBAR_ACCESS } from "@/lib/sidebar-registry";
import { ProfileIdentityFields, type ProfileData } from "@/components/profile/ProfileIdentityFields";

export interface ScreenSizeOption {
  label: string;
  width: number | null;
}

export const screenSizes: ScreenSizeOption[] = [
{ label: "iPad", width: 1024 },
{ label: "14\"", width: 1366 },
{ label: "16\"", width: 1536 },
{ label: "24\"", width: 1920 },
{ label: "27\"", width: 2560 },
{ label: "Full", width: null }];


interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  activeScreenSize: ScreenSizeOption;
  onScreenSizeChange: (size: ScreenSizeOption) => void;
  onBackToLauncher?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  appId?: string | null;
  apps?: AppDefinition[];
  onSwitchApp?: (appId: string) => void;
  userRole?: string | null;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
}

const defaultMenuItems: MenuItem[] = [
{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
{ id: "operations", label: "Operations", icon: Briefcase },
{ id: "invitations", label: "Invitations", icon: Mail },
{ id: "contracts", label: "Contracts", icon: FileText }];


const defaultSettingsItems: MenuItem[] = [
{ id: "contract-template", label: "Contract Template", icon: FileText },
{ id: "invitation-template", label: "Invitation Template", icon: Mail },
{ id: "contract-data", label: "Contract Data", icon: Briefcase },
{ id: "bank-list", label: "Bank Information", icon: Building2 },
{ id: "employee-register", label: "Employee Register", icon: Users },
{ id: "company-register", label: "Company Register", icon: Building2 },
{ id: "employee-id-settings", label: "Employee ID", icon: Users },
{ id: "contract-id-settings", label: "Contract ID", icon: FileText },
{ id: "iso-standards", label: "ISO Standards", icon: Shield },
{ id: "data-handling", label: "Data Handling", icon: FileSpreadsheet }];


const defaultConfigItems: MenuItem[] = [
{ id: "version-management", label: "Version Management", icon: GitBranch },
{ id: "process-guide", label: "Process Guide", icon: BookOpen },
{ id: "audit-log", label: "Audit Log", icon: Shield }];

// Forestry Project Manager menu items
const forestryMenuItems: MenuItem[] = [
{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
{ id: "forestry-projects", label: "Projects", icon: FolderKanban },
{ id: "gantt-view", label: "Gantt View", icon: BarChart3 },
{ id: "kanban-board", label: "Kanban Board", icon: Layers },
{ id: "employee-register", label: "Employees", icon: Users },
{ id: "analytics", label: "Analytics", icon: BarChart3 }];

const forestrySettingsItems: MenuItem[] = [
{ id: "settings", label: "Settings", icon: Settings },
{ id: "client-register", label: "Client Register", icon: Building2 },
{ id: "forestry-objects", label: "Object Register", icon: MapPin },
{ id: "project-id", label: "Project ID", icon: FileText },
{ id: "comp-groups", label: "Comp. Groups", icon: Briefcase },
{ id: "contract-data", label: "Contract Data", icon: Briefcase },
{ id: "project-defaults", label: "Project Defaults", icon: Settings },
{ id: "version-management", label: "Version Management", icon: GitBranch },
{ id: "iso-standards", label: "ISO Standards", icon: Shield }];

const forestryAuditItems: MenuItem[] = [
{ id: "audit-log", label: "Audit Log", icon: Shield }];

const forestryBottomItems: MenuItem[] = [
{ id: "process-guide", label: "Process Guide", icon: BookOpen }];

// Payroll Management menu items
import { DollarSign, MinusCircle, CreditCard, Zap, Umbrella, Thermometer, CheckSquare } from "lucide-react";

const payrollMenuItems: MenuItem[] = [
{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
{ id: "salary-events", label: "Salary Events", icon: Zap },
{ id: "absence", label: "Absence", icon: Thermometer },
{ id: "holiday", label: "Holiday", icon: Umbrella },
{ id: "attestation", label: "Attestation", icon: Shield },
{ id: "payroll-runs", label: "Payroll Runs", icon: Calendar },
{ id: "salary-slips", label: "Salary Slips", icon: FileText },
{ id: "employee-register", label: "Employees", icon: Users }];

const payrollSettingsItems: MenuItem[] = [
{ id: "salary-tables", label: "Salary Tables", icon: DollarSign },
{ id: "tax-reports", label: "Tax Reports", icon: BarChart3 },
{ id: "reports", label: "Reports", icon: FileSpreadsheet },
{ id: "deductions", label: "Deductions", icon: MinusCircle },
{ id: "tax-settings", label: "Tax Settings", icon: Shield },
{ id: "payment-methods", label: "Payment Methods", icon: CreditCard },
{ id: "settings", label: "Settings", icon: Settings }];

const payrollAuditItems: MenuItem[] = [
{ id: "audit-log", label: "Audit Log", icon: Shield }];

// Employee Hub menu items
const employeeHubMenuItems: MenuItem[] = [
{ id: "dashboard", label: "Time Clock", icon: Clock },
{ id: "my-profile", label: "My Profile", icon: Users },
{ id: "my-contracts", label: "My Contracts", icon: FileText },
{ id: "my-schedule", label: "My Schedule", icon: Calendar },
{ id: "my-payslips", label: "My Payslips", icon: FileSpreadsheet },
{ id: "leave-requests", label: "Leave Requests", icon: Calendar }];

const employeeHubSettingsItems: MenuItem[] = [
{ id: "settings", label: "Settings", icon: Settings }];

// Time & Status Reporting menu items
const timeReportingMenuItems: MenuItem[] = [
{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
{ id: "weekly-attendance", label: "Weekly Attendance", icon: CheckSquare },
{ id: "progress-reporting", label: "Progress Reporting", icon: BarChart3 },
{ id: "approvals", label: "Approvals", icon: Shield },
{ id: "reports", label: "Reports", icon: FileText }];

const timeReportingSettingsItems: MenuItem[] = [
{ id: "settings", label: "Settings", icon: Settings }];

const timeReportingAuditItems: MenuItem[] = [
{ id: "process-guide", label: "Process Guide", icon: BookOpen },
{ id: "audit-log", label: "Audit Log", icon: Shield }];



function loadOrder(key: string, defaults: MenuItem[]): MenuItem[] {
  try {
    const saved = localStorage.getItem(`sidebar-order-${key}`);
    if (!saved) return defaults;
    const ids: string[] = JSON.parse(saved);
    const map = new Map(defaults.map((item) => [item.id, item]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean) as MenuItem[];
    defaults.forEach((item) => {
      if (!ordered.find((o) => o.id === item.id)) ordered.push(item);
    });
    return ordered;
  } catch {
    return defaults;
  }
}

function saveOrder(key: string, items: MenuItem[]) {
  localStorage.setItem(`sidebar-order-${key}`, JSON.stringify(items.map((i) => i.id)));
}

/* ─── Sidebar Item (single menu button) ─────────────────────────── */

function SidebarItem({
  item,
  isActive,
  collapsed,
  onViewChange,
  badge,
  translatedLabel







}: {item: MenuItem;isActive: boolean;collapsed?: boolean;onViewChange: (view: string) => void;badge?: number;translatedLabel?: string;}) {
  const label = translatedLabel || item.label;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center justify-center p-2.5 rounded-lg transition-all relative",
              isActive ?
              "bg-sidebar-primary text-sidebar-primary-foreground" :
              "text-sidebar-foreground hover:bg-sidebar-accent"
            )}>
            
            {isActive &&
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
            }
            <item.icon className="w-4 h-4 shrink-0" />
            {badge && badge > 0 ?
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                {badge}
              </span> :
            null}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>);

  }

  return (
    <button
      onClick={() => onViewChange(item.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all relative",
        isActive ?
        "bg-sidebar-primary text-sidebar-primary-foreground font-semibold" :
        "text-sidebar-foreground font-medium hover:bg-sidebar-accent"
      )}>
      
      {isActive &&
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
      }
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && badge > 0 ?
      <span className="w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
          {badge}
        </span> :
      isActive ? <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" /> : null}
    </button>);

}

/* ─── Draggable Group ───────────────────────────────────────────── */

function DraggableGroup({
  items,
  groupKey,
  activeView,
  onViewChange,
  onReorder,
  collapsed,
  badges,
  t









}: {items: MenuItem[];groupKey: string;activeView: string;onViewChange: (view: string) => void;onReorder: (items: MenuItem[]) => void;collapsed?: boolean;badges?: Record<string, number>;t?: (key: string) => string;}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  overIndexRef.current = overIndex;

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-grip]")) return;

    e.preventDefault();
    e.stopPropagation();
    dragItemRef.current = index;
    setDragIndex(index);
    overIndexRef.current = null;
    setOverIndex(null);

    const handlePointerMove = (ev: PointerEvent) => {
      if (dragItemRef.current === null || !containerRef.current) return;
      const children = Array.from(containerRef.current.children) as HTMLElement[];
      let newOver = children.length - 1;
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (ev.clientY < midY) {
          newOver = i;
          break;
        }
      }
      overIndexRef.current = newOver;
      setOverIndex(newOver);
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      const from = dragItemRef.current;
      const to = overIndexRef.current;
      if (from !== null && to !== null && from !== to) {
        const newItems = [...items];
        const [moved] = newItems.splice(from, 1);
        newItems.splice(to, 0, moved);
        onReorder(newItems);
      }
      dragItemRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div ref={containerRef} className="space-y-0.5">
      {items.map((item, index) =>
      <div
        key={item.id}
        onPointerDown={(e) => handlePointerDown(e, index)}
        className={cn(
          "group relative select-none",
          dragIndex === index && "opacity-50",
          overIndex === index && dragIndex !== null && dragIndex !== index && (
          dragIndex < index ?
          "after:absolute after:left-3 after:right-3 after:bottom-0 after:h-0.5 after:bg-primary after:rounded-full" :
          "before:absolute before:left-3 before:right-3 before:top-0 before:h-0.5 before:bg-primary before:rounded-full")

        )}>
        
          {collapsed ?
        <SidebarItem item={item} isActive={activeView === item.id} collapsed onViewChange={onViewChange} badge={badges?.[item.id]} translatedLabel={t?.(`menu.${item.id}`)} /> :

        <div className="relative flex items-center">
              <div className="flex-1">
                <SidebarItem item={item} isActive={activeView === item.id} onViewChange={onViewChange} badge={badges?.[item.id]} translatedLabel={t?.(`menu.${item.id}`)} />
              </div>
              <span
            data-grip
            className="absolute right-1 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing p-0.5">
            
                <GripVertical className="w-3.5 h-3.5 text-sidebar-foreground" />
              </span>
            </div>
        }
        </div>
      )}
    </div>);

}

/* ─── Group Label ───────────────────────────────────────────────── */

function GroupLabel({ label, collapsed }: {label: string;collapsed: boolean;}) {
  if (collapsed) {
    return <div className="my-2 mx-1 border-t border-sidebar-border" />;
  }
  return (
    <div className="pt-5 pb-1.5 px-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-accent-foreground/50">
        {label}
      </span>
    </div>);

}

/* ─── Sidebar Header Card ───────────────────────────────────────── */

function AppSwitcherHeader({
  collapsed,
  appId,
  apps,
  onSwitchApp,
  onBackToLauncher,
  t,
  userRole








}: {collapsed: boolean;appId?: string | null;apps?: AppDefinition[];onSwitchApp?: (appId: string) => void;onBackToLauncher?: () => void;t: (key: string) => string;userRole?: string | null;}) {
  const [open, setOpen] = useState(false);
  const currentApp = apps?.find((a) => a.id === appId);
  const enabledApps = (apps?.filter((a) => a.enabled) ?? []).filter((app) => {
    if (app.adminOnly && userRole !== "admin") return false;
    if (app.allowedRoles && app.allowedRoles.length > 0 && userRole && !app.allowedRoles.includes(userRole)) return false;
    return true;
  });

  const CurrentIcon = currentApp ? getIcon(currentApp.iconName) : null;
  const currentColor = currentApp ? getColor(currentApp.colorIndex) : null;

  const handleSelect = (app: AppDefinition) => {
    if (app.id === appId) {
      setOpen(false);
      return;
    }
    if (!app.available) {
      toast.info(`${app.name} is coming soon`);
      setOpen(false);
      return;
    }
    onSwitchApp?.(app.id);
    setOpen(false);
  };

  if (collapsed) {
    return (
      <div className="p-2 flex justify-center shrink-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-sidebar-accent">
              {CurrentIcon && currentColor ?
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", currentColor.bg)}>
                  <CurrentIcon className={cn("w-5 h-5", currentColor.text)} />
                </div> :

              <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-primary flex items-center justify-center">
                  <img src={ljunganLogo} alt="Ljungan" className="w-6 h-6 object-contain" />
                </div>
              }
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" sideOffset={8} className="w-64 p-2">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">{t("ui.switchApp")}</p>
            <div className="space-y-0.5">
              {enabledApps.map((app) => {
                const Icon = getIcon(app.iconName);
                const color = getColor(app.colorIndex);
                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelect(app)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                      app.id === appId ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/50",
                      !app.available && "opacity-60"
                    )}>
                    
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", color.bg)}>
                      <Icon className={cn("w-4 h-4", color.text)} />
                    </div>
                    <span className="truncate text-sidebar-foreground">{app.name}</span>
                    {app.id === appId && <Check className="w-3.5 h-3.5 ml-auto text-sidebar-primary shrink-0" />}
                    {!app.available && <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>}
                  </button>);

              })}
            </div>
            {onBackToLauncher &&
            <>
                <div className="my-1.5 border-t border-border" />
                <button
                onClick={() => {onBackToLauncher();setOpen(false);}}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                
                  <LayoutGrid className="w-4 h-4" />
                  <span>{t("ui.backToAllApps")}</span>
                </button>
              </>
            }
          </PopoverContent>
        </Popover>
      </div>);

  }

  return (
    <div className="p-3 shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer">
            {CurrentIcon && currentColor ?
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", currentColor.bg)}>
                <CurrentIcon className={cn("w-5 h-5", currentColor.text)} />
              </div> :

            <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-primary flex items-center justify-center shrink-0">
                <img src={ljunganLogo} alt="Ljungan" className="w-6 h-6 object-contain" />
              </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-sidebar-foreground truncate">{currentApp?.name ?? "OnboardFlow"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{currentApp?.description?.split(",")[0] ?? "HR Management"}</p>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" sideOffset={4} className="w-[var(--radix-popover-trigger-width)] p-2">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">{t("ui.switchApp")}</p>
          <div className="space-y-0.5">
            {enabledApps.map((app) => {
              const Icon = getIcon(app.iconName);
              const color = getColor(app.colorIndex);
              return (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                    app.id === appId ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/50",
                    !app.available && "opacity-60"
                  )}>
                  
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", color.bg)}>
                    <Icon className={cn("w-4 h-4", color.text)} />
                  </div>
                  <span className="truncate text-sidebar-foreground">{app.name}</span>
                  {app.id === appId && <Check className="w-3.5 h-3.5 ml-auto text-sidebar-primary shrink-0" />}
                  {!app.available && <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>}
                </button>);

            })}
          </div>
          {onBackToLauncher &&
          <>
              <div className="my-1.5 border-t border-border" />
              <button
              onClick={() => {onBackToLauncher();setOpen(false);}}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
              
                <LayoutGrid className="w-4 h-4" />
                <span>{t("ui.backToAllApps")}</span>
              </button>
            </>
          }
        </PopoverContent>
      </Popover>
    </div>);

}

/* ─── Need Support Card ─────────────────────────────────────────── */

function NeedSupportCard({ collapsed, t }: {collapsed: boolean;t: (key: string) => string;}) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("sidebar-support-dismissed") === "true";
  });

  if (dismissed || collapsed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("sidebar-support-dismissed", "true");
  };

  return (
    <div className="px-3 pb-2 shrink-0">
      <div className="relative rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-0.5 rounded-md text-muted-foreground hover:text-sidebar-foreground transition-colors">
          
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <HeadphonesIcon className="w-4 h-4 text-sidebar-accent-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-sidebar-foreground">{t("ui.needSupport")}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              {t("ui.needSupportDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>);

}

/* ─── User Profile Dialog ───────────────────────────────────────── */

function UserProfileDialog({
  open,
  onOpenChange,
  t,
  lang,
  onLangChange






}: {open: boolean;onOpenChange: (open: boolean) => void;t: (key: string) => string;lang: UiLang;onLangChange: (lang: UiLang) => void;}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    avatarUrl: null,
    lang: lang,
    dateOfBirth: "",
    dialCode: "+46",
    localNumber: "",
    nationality: ""
  });

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? "");
      setIsGoogleUser(data.user.app_metadata?.provider === "google");
      supabase.
      from("profiles").
      select("full_name, avatar_url, date_of_birth, phone_number, nationality, preferred_language").
      eq("user_id", data.user.id).
      single().
      then(({ data: profile }) => {
        const p = profile as any;
        if (!p) return;
        const { dialCode: dc, localNumber: ln } = parsePhone(p.phone_number ?? "");
        setProfileData({
          fullName: p.full_name ?? "",
          avatarUrl: p.avatar_url ?? null,
          lang: p.preferred_language as UiLang ?? lang,
          dateOfBirth: p.date_of_birth ?? "",
          dialCode: dc,
          localNumber: ln,
          nationality: p.nationality ?? ""
        });
      });
    });
  }, [open, lang]);

  const handleSaveProfileFields = async () => {
    if (!userId) return;
    await (supabase as any).from("profiles").update({
      full_name: profileData.fullName || null,
      preferred_language: profileData.lang,
      date_of_birth: profileData.dateOfBirth || null,
      phone_number: combinePhone(profileData.dialCode, profileData.localNumber),
      nationality: profileData.nationality || null
    }).eq("user_id", userId);
    // Sync language to parent
    if (profileData.lang !== lang) {
      onLangChange(profileData.lang);
    }
    toast.success("Profile updated");
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;
    await supabase.storage.from("signatures").remove([`avatars/${userId}.png`]);
    await (supabase as any).from("profiles").update({ avatar_url: null }).eq("user_id", userId);
    setProfileData((prev) => ({ ...prev, avatarUrl: null }));
    toast.success("Avatar removed");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {toast.error("Password must be at least 6 characters");return;}
    if (newPassword !== confirmPassword) {toast.error("Passwords don't match");return;}
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {toast.error(error.message);return;}
    toast.success("Password updated");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("profile.title")}</DialogTitle>
          <DialogDescription className="sr-only">Manage your profile settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2 max-h-[60vh] overflow-y-auto">
          {userId &&
          <>
              <ProfileIdentityFields
              userId={userId}
              userEmail={userEmail}
              data={profileData}
              onChange={(patch) => setProfileData((prev) => ({ ...prev, ...patch }))}
              showAvatar />
            

              {/* Remove avatar button */}
              {profileData.avatarUrl &&
            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleRemoveAvatar}>
                  {t("profile.removeAvatar")}
                </Button>
            }

              <Button size="sm" onClick={handleSaveProfileFields}>
                {t("profile.saveChanges")}
              </Button>
            </>
          }

          {/* Password */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {t("profile.changePassword")}
            </Label>
            {isGoogleUser &&
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  You signed in with Google. Changing your password here only applies to email/password login and will not affect your Google sign-in.
                </span>
              </div>
            }
            <Input
              type="password"
              placeholder={t("profile.newPassword")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} />
            
            <Input
              type="password"
              placeholder={t("profile.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />
            
            <Button
              size="sm"
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword}>
              
              {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {t("profile.updatePassword")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}

/* ─── User Profile Footer Card ──────────────────────────────────── */

function UserProfileCard({ collapsed, onOpenProfile }: {collapsed: boolean;onOpenProfile: () => void;}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        setUserName(data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? null);
        // Fetch avatar
        supabase.
        from("profiles").
        select("avatar_url").
        eq("user_id", data.user.id).
        single().
        then(({ data: profile }) => {
          setAvatarUrl((profile as any)?.avatar_url ?? null);
        });
      }
    });
  }, []);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-2 py-2 flex justify-center cursor-pointer" onClick={onOpenProfile}>
            <Avatar className="w-8 h-8">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="text-xs font-semibold bg-sidebar-accent text-sidebar-accent-foreground uppercase">
                {userName?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p className="font-medium">{userName ?? "User"}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </TooltipContent>
      </Tooltip>);

  }

  return (
    <div className="p-3">
      <div
        className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer"
        onClick={onOpenProfile}>
        
        <Avatar className="w-8 h-8 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} />}
          <AvatarFallback className="text-xs font-semibold bg-sidebar-accent text-sidebar-accent-foreground uppercase">
            {userName?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-semibold text-sidebar-foreground truncate">{userName ?? "User"}</p>
            <BadgeCheck className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>);

}

/* ─── Organization Switcher ─────────────────────────────────────── */

function OrgSwitcherCompact({ collapsed, t }: {collapsed: boolean;t: (key: string) => string;}) {
  const { orgId, orgName, orgType, orgs, switchOrg } = useOrg();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const orgTypeConfig: Record<string, {label: string;color: string;icon: typeof Building2;}> = {
    production: { label: "Prod", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Building2 },
    sandbox: { label: "Sandbox", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: FlaskConical },
    demo: { label: "Demo", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400", icon: FlaskConical }
  };

  const currentConfig = orgTypeConfig[orgType || "production"] || orgTypeConfig.production;

  const handleSwitch = async (id: string) => {
    if (id === orgId) {setOpen(false);return;}
    await switchOrg(id);
    queryClient.invalidateQueries();
    setOpen(false);
    toast.success("Switched organization");
  };

  if (orgs.length <= 1) return null;

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="px-2 py-1.5 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-9 h-9 rounded-lg bg-sidebar-accent/60 flex items-center justify-center hover:bg-sidebar-accent transition-colors">
                  <Building2 className="w-4 h-4 text-sidebar-foreground/70" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {orgName || "Organization"}
              </TooltipContent>
            </Tooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-56 p-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">{t("ui.switchOrg")}</p>
          {orgs.map((org) => {
            const cfg = orgTypeConfig[org.org_type] || orgTypeConfig.production;
            return (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                  org.id === orgId ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/50"
                )}>
                
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{org.name}</span>
                {org.id === orgId && <Check className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />}
              </button>);

          })}
        </PopoverContent>
      </Popover>);

  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="mx-3 mb-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent/60 transition-colors text-left w-[calc(100%-1.5rem)]">
          <Building2 className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-tight">{orgName || "Organization"}</p>
          </div>
          <Badge variant="secondary" className={cn("text-[9px] px-1 py-0 shrink-0", currentConfig.color)}>
            {currentConfig.label}
          </Badge>
          <ChevronsUpDown className="w-3 h-3 text-sidebar-foreground/40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-60 p-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">{t("ui.switchOrg")}</p>
        {orgs.map((org) => {
          const cfg = orgTypeConfig[org.org_type] || orgTypeConfig.production;
          return (
            <button
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-left transition-colors",
                org.id === orgId ? "bg-accent font-medium" : "hover:bg-accent/50"
              )}>
              
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1 text-[13px]">{org.name}</span>
              <Badge variant="secondary" className={cn("text-[9px] px-1 py-0", cfg.color)}>
                {cfg.label}
              </Badge>
              {org.id === orgId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>);

        })}
      </PopoverContent>
    </Popover>);

}

/* ─── Main Sidebar ──────────────────────────────────────────────── */

export function Sidebar({ activeView, onViewChange, activeScreenSize, onScreenSizeChange, onBackToLauncher, collapsed = false, onCollapsedChange, appId, apps, onSwitchApp, userRole }: SidebarProps) {
  const isAdmin = userRole === "admin";
  const { t, lang, setLang } = useUiLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const isPublished = isPublishedEnvironment();

  const isForestry = appId === "forestry-project";
  const isPayroll = appId === "payroll";
  const isEmployeeHub = appId === "employee-hub";
  const isTimeReporting = appId === "time-reporting";

  const getMenuDefaults = () => {
    if (isTimeReporting) return timeReportingMenuItems;
    if (isEmployeeHub) return employeeHubMenuItems;
    if (isPayroll) return payrollMenuItems;
    if (isForestry) return forestryMenuItems;
    return defaultMenuItems;
  };
  const getSettingsDefaults = () => {
    if (isTimeReporting) return timeReportingSettingsItems;
    if (isEmployeeHub) return employeeHubSettingsItems;
    if (isPayroll) return payrollSettingsItems;
    if (isForestry) return forestrySettingsItems;
    return defaultSettingsItems;
  };
  const getConfigDefaults = () => {
    if (isTimeReporting) return timeReportingAuditItems;
    if (isEmployeeHub) return [];
    if (isPayroll) return payrollAuditItems;
    if (isForestry) return forestryAuditItems;
    return defaultConfigItems;
  };
  const getBottomDefaults = () => {
    if (isForestry) return forestryBottomItems;
    return [];
  };

  const menuPrefix = isTimeReporting ? "time-reporting" : isEmployeeHub ? "employee-hub" : isPayroll ? "payroll" : isForestry ? "forestry" : "";
  const [menuItems, setMenuItems] = useState(() => loadOrder(`${menuPrefix}-menu`, getMenuDefaults()));
  const [settingsItems, setSettingsItems] = useState(() => loadOrder(`${menuPrefix}-settings`, getSettingsDefaults()));
  const [configItems, setConfigItems] = useState(() => loadOrder(`${menuPrefix}-audit`, getConfigDefaults()));
  const [bottomItems, setBottomItems] = useState(getBottomDefaults);

  // Reset menu items when app changes
  useEffect(() => {
    const prefix = isTimeReporting ? "time-reporting" : isEmployeeHub ? "employee-hub" : isPayroll ? "payroll" : isForestry ? "forestry" : "";
    setMenuItems(loadOrder(`${prefix}-menu`, getMenuDefaults()));
    setSettingsItems(loadOrder(`${prefix}-settings`, getSettingsDefaults()));
    setConfigItems(loadOrder(`${prefix}-audit`, getConfigDefaults()));
    setBottomItems(getBottomDefaults());
  }, [appId, isForestry, isPayroll, isEmployeeHub, isTimeReporting]);

  // Fetch sidebar permissions for current role + app
  const { data: allowedItems } = useQuery({
    queryKey: ["role-sidebar-access", userRole, appId],
    queryFn: async () => {
      if (!userRole || !appId) return null;
      const { data, error } = await (supabase as any).
      from("role_sidebar_access").
      select("menu_item_id").
      eq("role", userRole).
      eq("app_id", appId);
      if (error) return null;
      return new Set((data as {menu_item_id: string;}[]).map((r) => r.menu_item_id));
    },
    enabled: !!userRole && !!appId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: () => {
      if (!userRole || !appId) return null;
      const defaults = DEFAULT_SIDEBAR_ACCESS[appId]?.[userRole as string];
      if (!defaults) return null;
      return new Set(defaults);
    }
  });

  // Filter items based on permissions from database — return nothing while loading
  const filterByPermission = (items: MenuItem[]): MenuItem[] => {
    if (!allowedItems) return [];
    if (allowedItems.size === 0 && userRole && appId) {
      const defaults = DEFAULT_SIDEBAR_ACCESS[appId]?.[userRole];
      if (defaults) {
        const defaultSet = new Set(defaults);
        return items.filter((item) => defaultSet.has(item.id));
      }
    }
    return items.filter((item) => allowedItems.has(item.id));
  };

  const filteredMenuItems = filterByPermission(menuItems);
  const filteredSettingsItems = filterByPermission(settingsItems);
  const filteredConfigItems = filterByPermission(configItems);
  const filteredBottomItems = filterByPermission(bottomItems);

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-signatures-count"],
    queryFn: async () => {
      const { count, error } = await supabase.
      from("contracts").
      select("id", { count: "exact", head: true }).
      eq("signing_status", "employee_signed");
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000
  });

  const handleLogout = async () => {
    await logoutWithAudit({ redirect: "https://ljungaverkforestry.lovable.app" });
  };

  const handleMenuReorder = useCallback((items: MenuItem[]) => {
    setMenuItems(items);
    saveOrder("menu", items);
  }, []);

  const handleSettingsReorder = useCallback((items: MenuItem[]) => {
    setSettingsItems(items);
    saveOrder("settings", items);
  }, []);

  const handleConfigReorder = useCallback((items: MenuItem[]) => {
    setConfigItems(items);
    saveOrder("config", items);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "h-screen sticky top-0 z-30 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-14" : "w-48 lg:w-56 xl:w-60"
      )}>
        {/* Header Card – App Switcher */}
        <AppSwitcherHeader collapsed={collapsed} appId={appId} apps={apps} onSwitchApp={onSwitchApp} onBackToLauncher={onBackToLauncher} t={t} userRole={userRole} />

        {/* Organization Switcher */}
        <OrgSwitcherCompact collapsed={collapsed} t={t} />

        <div className={cn("px-2 pb-1 shrink-0", collapsed ? "flex justify-center" : "flex justify-end")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCollapsedChange?.(!collapsed)}
                className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className={cn("py-2", collapsed ? "px-1.5" : "px-3")}>
            {appId === "user-management" ?
            <>
                <GroupLabel label={t("group.management")} collapsed={collapsed} />
                <SidebarItem item={{ id: "user-management", label: "Users", icon: Users }} isActive={activeView === "user-management"} onViewChange={onViewChange} collapsed={collapsed} translatedLabel={t("menu.user-management")} />
                <SidebarItem item={{ id: "role-permissions", label: "Role Permissions", icon: Shield }} isActive={activeView === "role-permissions"} onViewChange={onViewChange} collapsed={collapsed} translatedLabel={t("menu.role-permissions")} />
                <SidebarItem item={{ id: "audit-log", label: "Audit Log", icon: Shield }} isActive={activeView === "audit-log"} onViewChange={onViewChange} collapsed={collapsed} translatedLabel={t("menu.audit-log")} />
                <SidebarItem item={{ id: "settings", label: "Settings", icon: Settings }} isActive={activeView === "settings"} onViewChange={onViewChange} collapsed={collapsed} translatedLabel={t("menu.settings")} />
              </> :

            <>
                <GroupLabel label={t("group.main")} collapsed={collapsed} />
                <DraggableGroup
                items={filteredMenuItems}
                groupKey="menu"
                activeView={activeView}
                onViewChange={onViewChange}
                onReorder={handleMenuReorder}
                collapsed={collapsed}
                badges={{ contracts: pendingCount || 0 }}
                t={t} />
              

                {filteredSettingsItems.length > 0 &&
              <>
                    <GroupLabel label={t("group.settings")} collapsed={collapsed} />
                    <DraggableGroup
                  items={filteredSettingsItems}
                  groupKey="settings"
                  activeView={activeView}
                  onViewChange={onViewChange}
                  onReorder={handleSettingsReorder}
                  collapsed={collapsed}
                  t={t} />
                
                  </>
              }

                {filteredConfigItems.length > 0 &&
              <>
                    <GroupLabel label={isForestry ? t("group.audit") : t("group.others")} collapsed={collapsed} />
                    <DraggableGroup
                  items={filteredConfigItems}
                  groupKey="config"
                  activeView={activeView}
                  onViewChange={onViewChange}
                  onReorder={handleConfigReorder}
                  collapsed={collapsed}
                  t={t} />
                
                  </>
              }

                {filteredBottomItems.length > 0 &&
              <>
                    {filteredBottomItems.map((item) => (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        isActive={activeView === item.id}
                        onViewChange={onViewChange}
                        collapsed={collapsed}
                        translatedLabel={t(`menu.${item.id}`)}
                      />
                    ))}
                  </>
              }
              </>
            }
          </nav>
        </ScrollArea>

        {/* Screen Size Picker — hidden on published environments */}
        {!isPublished && (
        !collapsed ?
        <div className="px-3 pt-3 pb-1 border-t border-sidebar-border shrink-0">
              <div className="flex items-center gap-1.5 px-1 pb-2">
                <Monitor className="w-3.5 h-3.5 text-sidebar-foreground/50" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{t("ui.screen")}</span>
              </div>
              <div className="flex gap-0.5 bg-sidebar-accent/50 rounded-lg p-0.5">
                {screenSizes.map((size) =>
            <Button
              key={size.label}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-6 px-0 text-[10px] font-medium rounded-md transition-all",
                activeScreenSize.label === size.label ?
                "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground" :
                "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              onClick={() => onScreenSizeChange(size)}>
              
                    {size.label}
                  </Button>
            )}
              </div>
            </div> :

        <div className="px-1.5 pt-2 pb-1 border-t border-sidebar-border shrink-0 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                    <Monitor className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("ui.screen")}: {activeScreenSize.label}
                </TooltipContent>
              </Tooltip>
            </div>)

        }

        {/* Back to Launcher — more prominent */}
        {onBackToLauncher &&
        <div className={cn("border-t border-sidebar-border shrink-0", collapsed ? "px-1.5 pt-2" : "px-3 pt-3")}>
            {collapsed ?
          <Tooltip>
                <TooltipTrigger asChild>
                  <button
                onClick={onBackToLauncher}
                className="w-full flex items-center justify-center p-2.5 rounded-lg text-sidebar-foreground bg-sidebar-accent/60 hover:bg-sidebar-accent transition-colors">
                
                    <LayoutGrid className="w-4.5 h-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>{t("ui.allApps")}</TooltipContent>
              </Tooltip> :

          <button
            onClick={onBackToLauncher}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
            
                <LayoutGrid className="w-4.5 h-4.5" />
                <span>{t("ui.allApps")}</span>
              </button>
          }
          </div>
        }

        {/* Sign Out */}
        <div className={cn("border-t border-sidebar-border shrink-0", collapsed ? "p-1.5" : "px-3 pt-2")}>
          {collapsed ?
          <Tooltip>
              <TooltipTrigger asChild>
                <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{t("ui.signOut")}</TooltipContent>
            </Tooltip> :

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
            
              <LogOut className="w-4 h-4" />
              <span>{t("ui.signOut")}</span>
            </button>
          }
        </div>

        {/* Need Support Card */}
        <NeedSupportCard collapsed={collapsed} t={t} />

        {/* User Profile Footer */}
        <UserProfileCard collapsed={collapsed} onOpenProfile={() => setProfileOpen(true)} />

        {/* Profile Settings Dialog */}
        <UserProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          t={t}
          lang={lang}
          onLangChange={setLang} />
        
      </aside>
    </TooltipProvider>);

}