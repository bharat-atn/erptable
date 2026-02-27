import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { type AppDefinition, getIcon, getColor } from "./AppLauncher";
import { toast } from "sonner";
import ljunganLogo from "@/assets/ljungan-forestry-logo.png";

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
  { label: "Full", width: null },
];

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
  icon: React.ComponentType<{ className?: string }>;
}

const defaultMenuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "operations", label: "Operations", icon: Briefcase },
  { id: "invitations", label: "Invitations", icon: Mail },
  { id: "contracts", label: "Contracts", icon: FileText },
];

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
];

const defaultConfigItems: MenuItem[] = [
  { id: "version-management", label: "Version Management", icon: GitBranch },
  { id: "process-guide", label: "Process Guide", icon: BookOpen },
  { id: "audit-log", label: "Audit Log", icon: Shield },
];

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
}: {
  item: MenuItem;
  isActive: boolean;
  collapsed?: boolean;
  onViewChange: (view: string) => void;
  badge?: number;
}) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center justify-center p-2.5 rounded-lg transition-all relative",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'hsl(250 85% 45%)' }} />
            )}
            <item.icon className="w-4 h-4 shrink-0" />
            {badge && badge > 0 ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                {badge}
              </span>
            ) : null}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={() => onViewChange(item.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all relative",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
          : "text-sidebar-foreground font-medium hover:bg-sidebar-accent"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'hsl(250 85% 45%)' }} />
      )}
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {badge && badge > 0 ? (
        <span className="w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
          {badge}
        </span>
      ) : isActive ? <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" /> : null}
    </button>
  );
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
}: {
  items: MenuItem[];
  groupKey: string;
  activeView: string;
  onViewChange: (view: string) => void;
  onReorder: (items: MenuItem[]) => void;
  collapsed?: boolean;
  badges?: Record<string, number>;
}) {
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
      {items.map((item, index) => (
        <div
          key={item.id}
          onPointerDown={(e) => handlePointerDown(e, index)}
          className={cn(
            "group relative select-none",
            dragIndex === index && "opacity-50",
            overIndex === index && dragIndex !== null && dragIndex !== index && (
              (dragIndex < index)
                ? "after:absolute after:left-3 after:right-3 after:bottom-0 after:h-0.5 after:bg-primary after:rounded-full"
                : "before:absolute before:left-3 before:right-3 before:top-0 before:h-0.5 before:bg-primary before:rounded-full"
            ),
          )}
        >
          {collapsed ? (
            <SidebarItem item={item} isActive={activeView === item.id} collapsed onViewChange={onViewChange} badge={badges?.[item.id]} />
          ) : (
            <div className="relative flex items-center">
              <div className="flex-1">
                <SidebarItem item={item} isActive={activeView === item.id} onViewChange={onViewChange} badge={badges?.[item.id]} />
              </div>
              <span
                data-grip
                className="absolute right-1 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing p-0.5"
              >
                <GripVertical className="w-3.5 h-3.5 text-sidebar-foreground" />
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Group Label ───────────────────────────────────────────────── */

function GroupLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="my-2 mx-1 border-t border-sidebar-border" />;
  }
  return (
    <div className="pt-5 pb-1.5 px-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-accent-foreground/50">
        {label}
      </span>
    </div>
  );
}

/* ─── Sidebar Header Card ───────────────────────────────────────── */

function AppSwitcherHeader({
  collapsed,
  appId,
  apps,
  onSwitchApp,
  onBackToLauncher,
}: {
  collapsed: boolean;
  appId?: string | null;
  apps?: AppDefinition[];
  onSwitchApp?: (appId: string) => void;
  onBackToLauncher?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const currentApp = apps?.find((a) => a.id === appId);
  const enabledApps = apps?.filter((a) => a.enabled) ?? [];

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
              {CurrentIcon && currentColor ? (
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", currentColor.bg)}>
                  <CurrentIcon className={cn("w-5 h-5", currentColor.text)} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-primary flex items-center justify-center">
                  <img src={ljunganLogo} alt="Ljungan" className="w-6 h-6 object-contain" />
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" sideOffset={8} className="w-64 p-2">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">Switch Application</p>
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
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", color.bg)}>
                      <Icon className={cn("w-4 h-4", color.text)} />
                    </div>
                    <span className="truncate text-sidebar-foreground">{app.name}</span>
                    {app.id === appId && <Check className="w-3.5 h-3.5 ml-auto text-sidebar-primary shrink-0" />}
                    {!app.available && <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>}
                  </button>
                );
              })}
            </div>
            {onBackToLauncher && (
              <>
                <div className="my-1.5 border-t border-border" />
                <button
                  onClick={() => { onBackToLauncher(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Back to All Apps</span>
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="p-3 shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer">
            {CurrentIcon && currentColor ? (
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", currentColor.bg)}>
                <CurrentIcon className={cn("w-5 h-5", currentColor.text)} />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden bg-sidebar-primary flex items-center justify-center shrink-0">
                <img src={ljunganLogo} alt="Ljungan" className="w-6 h-6 object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-sidebar-foreground truncate">{currentApp?.name ?? "OnboardFlow"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{currentApp?.description?.split(",")[0] ?? "HR Management"}</p>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" sideOffset={4} className="w-[var(--radix-popover-trigger-width)] p-2">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">Switch Application</p>
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
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", color.bg)}>
                    <Icon className={cn("w-4 h-4", color.text)} />
                  </div>
                  <span className="truncate text-sidebar-foreground">{app.name}</span>
                  {app.id === appId && <Check className="w-3.5 h-3.5 ml-auto text-sidebar-primary shrink-0" />}
                  {!app.available && <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>}
                </button>
              );
            })}
          </div>
          {onBackToLauncher && (
            <>
              <div className="my-1.5 border-t border-border" />
              <button
                onClick={() => { onBackToLauncher(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Back to All Apps</span>
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─── Need Support Card ─────────────────────────────────────────── */

function NeedSupportCard({ collapsed }: { collapsed: boolean }) {
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
          className="absolute top-2 right-2 p-0.5 rounded-md text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <HeadphonesIcon className="w-4 h-4 text-sidebar-accent-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-sidebar-foreground">Need Support</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Contact with one of our experts to get support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── User Profile Footer Card ──────────────────────────────────── */

function UserProfileCard({ collapsed }: { collapsed: boolean }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        setUserName(data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? null);
      }
    });
  }, []);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-2 py-2 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground uppercase">
              {userName?.[0] ?? "U"}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p className="font-medium">{userName ?? "User"}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground uppercase shrink-0">
          {userName?.[0] ?? "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-semibold text-sidebar-foreground truncate">{userName ?? "User"}</p>
            <BadgeCheck className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

/* ─── Version Badge ─────────────────────────────────────────────── */

const releaseTypeColors: Record<string, string> = {
  alpha: "text-amber-600",
  beta: "text-blue-600",
  rc: "text-orange-600",
  release: "text-emerald-600",
};

const releaseTypeLabels: Record<string, string> = {
  alpha: "Alpha",
  beta: "Beta",
  rc: "RC",
  release: "Release",
};

function VersionBadge({ collapsed }: { collapsed: boolean }) {
  const { data: latestVersion } = useQuery({
    queryKey: ["latest-version"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_versions")
        .select("*")
        .eq("status", "published")
        .order("release_date", { ascending: false })
        .order("sequence_number", { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data as any;
    },
    refetchInterval: 60000,
  });

  if (!latestVersion) return null;

  const typeColor = releaseTypeColors[latestVersion.release_type] ?? "text-muted-foreground";
  const typeLabel = releaseTypeLabels[latestVersion.release_type] ?? latestVersion.release_type;
  const timeGMT = new Date(latestVersion.release_time_utc).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }) + " GMT";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeLocal = new Date(latestVersion.release_time_utc).toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }) + ` ${tz.split("/").pop()}`;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-1.5 py-1 flex justify-center">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", typeColor)}>
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="max-w-[220px]">
          <p className="font-mono font-semibold text-xs">{latestVersion.version_tag}</p>
          <p className={cn("text-[10px] font-medium", typeColor)}>{typeLabel}</p>
          {latestVersion.notes && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{latestVersion.notes}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
          <Tag className={cn("w-3.5 h-3.5 shrink-0", typeColor)} />
          <span className="font-mono font-semibold text-sidebar-foreground truncate">{latestVersion.version_tag}</span>
          <span className={cn("text-[10px] font-medium ml-auto shrink-0", typeColor)}>{typeLabel}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="end" sideOffset={8} className="w-72">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm">{latestVersion.version_tag}</span>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", 
              latestVersion.release_type === "release" ? "bg-emerald-500/10 text-emerald-600" :
              latestVersion.release_type === "rc" ? "bg-orange-500/10 text-orange-600" :
              latestVersion.release_type === "beta" ? "bg-blue-500/10 text-blue-600" :
              "bg-amber-500/10 text-amber-600"
            )}>{typeLabel}</span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Released {new Date(latestVersion.release_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{timeGMT} / {timeLocal}</span>
            </div>
          </div>
          {latestVersion.notes && (
            <div className="pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">{latestVersion.notes}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/* ─── Main Sidebar ──────────────────────────────────────────────── */

export function Sidebar({ activeView, onViewChange, activeScreenSize, onScreenSizeChange, onBackToLauncher, collapsed = false, onCollapsedChange, appId, apps, onSwitchApp, userRole }: SidebarProps) {
  const isAdmin = userRole === "admin";

  const [menuItems, setMenuItems] = useState(() => loadOrder("menu", defaultMenuItems));
  const [settingsItems, setSettingsItems] = useState(() => loadOrder("settings", defaultSettingsItems));
  const [configItems, setConfigItems] = useState(() => loadOrder("config", defaultConfigItems));

  // Fetch sidebar permissions for current role + app
  const { data: allowedItems } = useQuery({
    queryKey: ["role-sidebar-access", userRole, appId],
    queryFn: async () => {
      if (!userRole || !appId) return null;
      const { data, error } = await (supabase as any)
        .from("role_sidebar_access")
        .select("menu_item_id")
        .eq("role", userRole)
        .eq("app_id", appId);
      if (error) return null;
      return new Set((data as { menu_item_id: string }[]).map((r) => r.menu_item_id));
    },
    enabled: !!userRole && !!appId,
  });

  // Filter items based on permissions from database — return nothing while loading
  const filterByPermission = (items: MenuItem[]): MenuItem[] => {
    if (!allowedItems) return [];
    return items.filter((item) => allowedItems.has(item.id));
  };

  const filteredMenuItems = filterByPermission(menuItems);
  const filteredSettingsItems = filterByPermission(settingsItems);
  const filteredConfigItems = filterByPermission(configItems);

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-signatures-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("signing_status", "employee_signed");
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.rpc("log_auth_event", {
        _action: "LOGOUT",
        _user_id: session.user.id,
        _user_email: session.user.email ?? null,
        _summary: `${session.user.email} logged out`,
      });
    }
    await supabase.auth.signOut();
    window.location.href = "https://ljungaverkforestry.lovable.app";
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
        <AppSwitcherHeader collapsed={collapsed} appId={appId} apps={apps} onSwitchApp={onSwitchApp} onBackToLauncher={onBackToLauncher} />

        {/* Collapse Toggle */}
        <div className={cn("px-2 pb-1 shrink-0", collapsed ? "flex justify-center" : "flex justify-end")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCollapsedChange?.(!collapsed)}
                className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
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
            {appId === "user-management" ? (
              <>
                <GroupLabel label="Management" collapsed={collapsed} />
                <SidebarItem item={{ id: "user-management", label: "Users", icon: Users }} isActive={activeView === "user-management"} onViewChange={onViewChange} collapsed={collapsed} />
                <SidebarItem item={{ id: "role-permissions", label: "Role Permissions", icon: Shield }} isActive={activeView === "role-permissions"} onViewChange={onViewChange} collapsed={collapsed} />
                <SidebarItem item={{ id: "audit-log", label: "Audit Log", icon: Shield }} isActive={activeView === "audit-log"} onViewChange={onViewChange} collapsed={collapsed} />
                <SidebarItem item={{ id: "settings", label: "Settings", icon: Settings }} isActive={activeView === "settings"} onViewChange={onViewChange} collapsed={collapsed} />
              </>
            ) : (
              <>
                <GroupLabel label="Main" collapsed={collapsed} />
                <DraggableGroup
                  items={filteredMenuItems}
                  groupKey="menu"
                  activeView={activeView}
                  onViewChange={onViewChange}
                  onReorder={handleMenuReorder}
                  collapsed={collapsed}
                  badges={{ contracts: pendingCount || 0 }}
                />

                {filteredSettingsItems.length > 0 && (
                  <>
                    <GroupLabel label="Settings" collapsed={collapsed} />
                    <DraggableGroup
                      items={filteredSettingsItems}
                      groupKey="settings"
                      activeView={activeView}
                      onViewChange={onViewChange}
                      onReorder={handleSettingsReorder}
                      collapsed={collapsed}
                    />
                  </>
                )}

                {filteredConfigItems.length > 0 && (
                  <>
                    <GroupLabel label="Others" collapsed={collapsed} />
                    <DraggableGroup
                      items={filteredConfigItems}
                      groupKey="config"
                      activeView={activeView}
                      onViewChange={onViewChange}
                      onReorder={handleConfigReorder}
                      collapsed={collapsed}
                    />
                  </>
                )}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Screen Size Picker */}
        {!collapsed ? (
          <div className="px-3 pt-3 pb-1 border-t border-sidebar-border shrink-0">
            <div className="flex items-center gap-1.5 px-1 pb-2">
              <Monitor className="w-3.5 h-3.5 text-sidebar-foreground/50" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">Screen</span>
            </div>
            <div className="flex gap-0.5 bg-sidebar-accent/50 rounded-lg p-0.5">
              {screenSizes.map((size) => (
                <Button
                  key={size.label}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 h-6 px-0 text-[10px] font-medium rounded-md transition-all",
                    activeScreenSize.label === size.label
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  onClick={() => onScreenSizeChange(size)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-1.5 pt-2 pb-1 border-t border-sidebar-border shrink-0 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                  <Monitor className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Screen: {activeScreenSize.label}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Back to Launcher */}
        {onBackToLauncher && (
          <div className={cn("border-t border-sidebar-border shrink-0", collapsed ? "px-1.5 pt-2" : "px-3 pt-3")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onBackToLauncher}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>All Apps</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={onBackToLauncher}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>All Apps</span>
              </button>
            )}
          </div>
        )}

        {/* Version Badge */}
        <div className={cn("border-t border-sidebar-border shrink-0", collapsed ? "px-1.5 pt-1" : "px-3 pt-2")}>
          <VersionBadge collapsed={collapsed} />
        </div>

        {/* Sign Out */}
        <div className={cn("border-t border-sidebar-border shrink-0", collapsed ? "p-1.5" : "px-3 pt-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Need Support Card */}
        <NeedSupportCard collapsed={collapsed} />

        {/* User Profile Footer */}
        <UserProfileCard collapsed={collapsed} />
      </aside>
    </TooltipProvider>
  );
}
