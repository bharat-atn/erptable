import { useState, useCallback, useRef, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  { id: "employee-register", label: "Employee Register", icon: Users },
  { id: "company-register", label: "Company Register", icon: Building2 },
  { id: "employee-id-settings", label: "Employee ID", icon: Users },
  { id: "contract-id-settings", label: "Contract ID", icon: FileText },
  { id: "iso-standards", label: "ISO Standards", icon: Shield },
];

const defaultConfigItems: MenuItem[] = [
  { id: "process-guide", label: "Process Guide", icon: BookOpen },
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
}: {
  item: MenuItem;
  isActive: boolean;
  collapsed?: boolean;
  onViewChange: (view: string) => void;
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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full" />
            )}
            <item.icon className="w-4 h-4 shrink-0" />
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
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full" />
      )}
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
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
}: {
  items: MenuItem[];
  groupKey: string;
  activeView: string;
  onViewChange: (view: string) => void;
  onReorder: (items: MenuItem[]) => void;
  collapsed?: boolean;
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
            <SidebarItem item={item} isActive={activeView === item.id} collapsed onViewChange={onViewChange} />
          ) : (
            <div className="relative flex items-center">
              <div className="flex-1">
                <SidebarItem item={item} isActive={activeView === item.id} onViewChange={onViewChange} />
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
      <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
        {label}
      </span>
    </div>
  );
}

/* ─── Sidebar Header Card ───────────────────────────────────────── */

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="p-2 flex justify-center shrink-0">
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-sidebar-primary flex items-center justify-center shrink-0">
          <img src={ljunganLogo} alt="Ljungan" className="w-6 h-6 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 shrink-0">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-sidebar-primary flex items-center justify-center shrink-0">
          <img src={ljunganLogo} alt="Ljungan" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">OnboardFlow</p>
          <p className="text-[11px] text-sidebar-foreground truncate">HR Management</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground shrink-0" />
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
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-primary-foreground uppercase">
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
          <p className="text-sm font-medium text-foreground truncate">{userName ?? "User"}</p>
          <p className="text-[11px] text-sidebar-foreground truncate">{userEmail}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground shrink-0" />
      </div>
    </div>
  );
}

/* ─── Main Sidebar ──────────────────────────────────────────────── */

export function Sidebar({ activeView, onViewChange, activeScreenSize, onScreenSizeChange, onBackToLauncher, collapsed = false, onCollapsedChange }: SidebarProps) {
  const [menuItems, setMenuItems] = useState(() => loadOrder("menu", defaultMenuItems));
  const [settingsItems, setSettingsItems] = useState(() => loadOrder("settings", defaultSettingsItems));
  const [configItems, setConfigItems] = useState(() => loadOrder("config", defaultConfigItems));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://scandi-forest-zen.lovable.app";
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
        "h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-14" : "w-48 lg:w-56 xl:w-60"
      )}>
        {/* Header Card */}
        <SidebarHeader collapsed={collapsed} />

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
            <GroupLabel label="Main" collapsed={collapsed} />
            <DraggableGroup
              items={menuItems}
              groupKey="menu"
              activeView={activeView}
              onViewChange={onViewChange}
              onReorder={handleMenuReorder}
              collapsed={collapsed}
            />

            <GroupLabel label="Settings" collapsed={collapsed} />
            <DraggableGroup
              items={settingsItems}
              groupKey="settings"
              activeView={activeView}
              onViewChange={onViewChange}
              onReorder={handleSettingsReorder}
              collapsed={collapsed}
            />

            <GroupLabel label="Others" collapsed={collapsed} />
            <DraggableGroup
              items={configItems}
              groupKey="config"
              activeView={activeView}
              onViewChange={onViewChange}
              onReorder={handleConfigReorder}
              collapsed={collapsed}
            />
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

        {/* User Profile Footer */}
        <UserProfileCard collapsed={collapsed} />
      </aside>
    </TooltipProvider>
  );
}
