import { useState, useCallback, useRef } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ScreenSizeOption {
  label: string;
  width: number | null;
}

export const screenSizes: ScreenSizeOption[] = [
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
  { id: "employee-register", label: "Employee Register", icon: Users },
  { id: "company-register", label: "Company Register", icon: Building2 },
  { id: "employee-id-settings", label: "Employee ID", icon: Users },
  { id: "contract-id-settings", label: "Contract ID", icon: FileText },
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
    // Append any new items not in saved order
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

function DraggableGroup({
  items,
  groupKey,
  activeView,
  onViewChange,
  onReorder,
}: {
  items: MenuItem[];
  groupKey: string;
  activeView: string;
  onViewChange: (view: string) => void;
  onReorder: (items: MenuItem[]) => void;
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
    <div ref={containerRef}>
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
          <button
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeView === item.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <span
              data-grip
              className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing p-0.5"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function Sidebar({ activeView, onViewChange, activeScreenSize, onScreenSizeChange, onBackToLauncher }: SidebarProps) {
  const [menuItems, setMenuItems] = useState(() => loadOrder("menu", defaultMenuItems));
  const [settingsItems, setSettingsItems] = useState(() => loadOrder("settings", defaultSettingsItems));
  const [configItems, setConfigItems] = useState(() => loadOrder("config", defaultConfigItems));

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    <aside className="w-44 lg:w-52 xl:w-56 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <Layers className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-primary-foreground">OnboardFlow</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="px-3 py-4 space-y-1">
          <DraggableGroup
            items={menuItems}
            groupKey="menu"
            activeView={activeView}
            onViewChange={onViewChange}
            onReorder={handleMenuReorder}
          />

          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </span>
          </div>
          <DraggableGroup
            items={settingsItems}
            groupKey="settings"
            activeView={activeView}
            onViewChange={onViewChange}
            onReorder={handleSettingsReorder}
          />

          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Configuration
            </span>
          </div>
          <DraggableGroup
            items={configItems}
            groupKey="config"
            activeView={activeView}
            onViewChange={onViewChange}
            onReorder={handleConfigReorder}
          />
        </nav>
      </ScrollArea>

      {/* Screen Size Picker */}
      <div className="px-3 pt-3 pb-1 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-1.5 px-1 pb-2">
          <Monitor className="w-3.5 h-3.5 text-sidebar-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">Screen</span>
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

      {/* Back to Launcher */}
      {onBackToLauncher && (
        <div className="px-3 pt-3 border-t border-sidebar-border shrink-0">
          <button
            onClick={onBackToLauncher}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>All Apps</span>
          </button>
        </div>
      )}

      {/* Sign Out */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
