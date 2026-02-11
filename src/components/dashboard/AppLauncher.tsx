import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  TreePine,
  Smartphone,
  FileText,
  BarChart3,
  CalendarDays,
  Shield,
  Truck,
  Warehouse,
  ArrowRight,
  GripVertical,
  Eye,
  EyeOff,
  Settings2,
} from "lucide-react";

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  enabled: boolean;
  available: boolean; // false = "coming soon"
}

const defaultApps: AppDefinition[] = [
  {
    id: "hr-management",
    name: "HR Management System",
    description: "Manage employee records, track performance, handle recruitment, and oversee all human resources operations.",
    icon: Users,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    enabled: true,
    available: true,
  },
  {
    id: "forestry-project",
    name: "Forestry Project Manager",
    description: "Manage forestry projects, track clearing and planting operations, team assignments, and financial planning.",
    icon: TreePine,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    enabled: true,
    available: false,
  },
  {
    id: "payroll",
    name: "Payroll Management",
    description: "Process payroll, manage employee compensation, track deductions, and handle salary administration.",
    icon: DollarSign,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    enabled: true,
    available: false,
  },
  {
    id: "employee-hub",
    name: "Employee Hub",
    description: "Mobile app for employees to manage personal information, view contracts, and report daily attendance.",
    icon: Smartphone,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    enabled: true,
    available: false,
  },
];

function loadApps(): AppDefinition[] {
  try {
    const saved = localStorage.getItem("app-launcher-config");
    if (!saved) return defaultApps;
    const config: { id: string; enabled: boolean }[] = JSON.parse(saved);
    const map = new Map(defaultApps.map((a) => [a.id, a]));
    const ordered: AppDefinition[] = [];
    config.forEach(({ id, enabled }) => {
      const app = map.get(id);
      if (app) ordered.push({ ...app, enabled });
    });
    // Append any new apps not in saved config
    defaultApps.forEach((app) => {
      if (!ordered.find((o) => o.id === app.id)) ordered.push(app);
    });
    return ordered;
  } catch {
    return defaultApps;
  }
}

function saveApps(apps: AppDefinition[]) {
  localStorage.setItem(
    "app-launcher-config",
    JSON.stringify(apps.map((a) => ({ id: a.id, enabled: a.enabled })))
  );
}

interface AppLauncherProps {
  onLaunchApp: (appId: string) => void;
}

export function AppLauncher({ onLaunchApp }: AppLauncherProps) {
  const [apps, setApps] = useState<AppDefinition[]>(loadApps);
  const [editMode, setEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);

  const visibleApps = editMode ? apps : apps.filter((a) => a.enabled);

  const toggleApp = (id: string) => {
    const updated = apps.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setApps(updated);
    saveApps(updated);
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (!editMode) return;
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
        const cards = Array.from(
          containerRef.current.querySelectorAll("[data-app-card]")
        ) as HTMLElement[];
        let newOver = cards.length - 1;
        for (let i = 0; i < cards.length; i++) {
          const rect = cards[i].getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          const midY = rect.top + rect.height / 2;
          if (ev.clientY < rect.bottom && ev.clientX < midX) {
            newOver = i;
            break;
          }
          if (ev.clientY < rect.top) {
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
          const source = editMode ? apps : apps.filter((a) => a.enabled);
          const newItems = [...source];
          const [moved] = newItems.splice(from, 1);
          newItems.splice(to, 0, moved);

          if (editMode) {
            setApps(newItems);
            saveApps(newItems);
          }
        }

        dragItemRef.current = null;
        setDragIndex(null);
        setOverIndex(null);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [editMode, apps]
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Application Launcher</h1>
          <p className="text-muted-foreground">Choose an application to continue</p>
        </div>

        {/* App Grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
        >
          {visibleApps.map((app, index) => (
            <div
              key={app.id}
              data-app-card
              onPointerDown={(e) => handlePointerDown(e, index)}
              className={cn(
                "group relative bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col items-center text-center transition-all duration-200 select-none",
                app.available && app.enabled && "hover:shadow-md hover:border-primary/30",
                !app.enabled && "opacity-50",
                dragIndex === index && "opacity-40 scale-95",
                overIndex === index &&
                  dragIndex !== null &&
                  dragIndex !== index &&
                  "ring-2 ring-primary/40"
              )}
            >
              {/* Edit mode controls */}
              {editMode && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => toggleApp(app.id)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title={app.enabled ? "Hide app" : "Show app"}
                  >
                    {app.enabled ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <span
                    data-grip
                    className="p-1.5 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", app.iconBg)}>
                <app.icon className={cn("w-6 h-6", app.iconColor)} />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-foreground mb-2">{app.name}</h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{app.description}</p>

              {/* Launch action */}
              <div className="mt-auto">
                {app.available ? (
                  <button
                    onClick={() => !editMode && onLaunchApp(app.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline transition-colors",
                      editMode && "pointer-events-none opacity-50"
                    )}
                  >
                    Launch App <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/60">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            {editMode ? "Done Editing" : "Customize Launcher"}
          </Button>
          <p className="text-xs text-muted-foreground">
            All applications share common employee data and resources.
          </p>
        </div>
      </div>
    </div>
  );
}
