import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${groupKey}-${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, moved);
    onReorder(newItems);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "group relative",
            overIndex === index && dragIndex !== null && dragIndex !== index && "before:absolute before:left-3 before:right-3 before:top-0 before:h-0.5 before:bg-primary before:rounded-full",
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
            <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity shrink-0 cursor-grab" />
          </button>
        </div>
      ))}
    </>
  );
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
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
    <aside className="w-56 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
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

      {/* Sign Out */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
