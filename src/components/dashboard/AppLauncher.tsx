import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Pencil,
  Trash2,
  Layers,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  Clock,
  CreditCard,
  Globe,
  Heart,
  Mail,
  MapPin,
  Package,
  LogOut,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TeaserDialog } from "./TeaserDialog";

const ICON_MAP: Record<string, LucideIcon> = {
  Users, DollarSign, TreePine, Smartphone, FileText, BarChart3, CalendarDays,
  Shield, Truck, Warehouse, Layers, BookOpen, Briefcase, Building2,
  ClipboardList, Clock, CreditCard, Globe, Heart, Mail, MapPin, Package,
};

const COLOR_OPTIONS = [
  { label: "Emerald", bg: "bg-emerald-100", text: "text-emerald-600" },
  { label: "Blue", bg: "bg-blue-100", text: "text-blue-600" },
  { label: "Orange", bg: "bg-orange-100", text: "text-orange-600" },
  { label: "Green", bg: "bg-green-100", text: "text-green-600" },
  { label: "Purple", bg: "bg-purple-100", text: "text-purple-600" },
  { label: "Red", bg: "bg-red-100", text: "text-red-600" },
  { label: "Amber", bg: "bg-amber-100", text: "text-amber-600" },
  { label: "Indigo", bg: "bg-indigo-100", text: "text-indigo-600" },
  { label: "Pink", bg: "bg-pink-100", text: "text-pink-600" },
  { label: "Teal", bg: "bg-teal-100", text: "text-teal-600" },
];

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorIndex: number;
  enabled: boolean;
  available: boolean;
  launchUrl?: string;
  adminOnly?: boolean;
  /** Roles that can see this app. If omitted, visible to all roles. */
  allowedRoles?: string[];
}

const defaultApps: AppDefinition[] = [
  {
    id: "hr-management",
    name: "HR Management System",
    description: "Manage employee records, handle recruitment, onboarding, contracts, and oversee all human resources operations.",
    iconName: "Users",
    colorIndex: 0,
    enabled: true,
    available: true,
    allowedRoles: ["admin", "org_admin", "hr_manager"],
  },
  {
    id: "user-management",
    name: "User Management",
    description: "Manage system users, approve new signups, and assign roles for access control.",
    iconName: "Shield",
    colorIndex: 7,
    enabled: true,
    available: true,
    adminOnly: true,
    allowedRoles: ["admin"],
  },
  {
    id: "forestry-project",
    name: "Forestry Project Manager",
    description: "Manage forestry projects, track clearing and planting operations, team assignments, and financial planning.",
    iconName: "TreePine",
    colorIndex: 2,
    enabled: true,
    available: false,
    allowedRoles: ["admin", "org_admin", "project_manager"],
  },
  {
    id: "payroll",
    name: "Payroll Management",
    description: "Process payroll, manage employee compensation, track deductions, and handle salary administration.",
    iconName: "DollarSign",
    colorIndex: 3,
    enabled: true,
    available: false,
    allowedRoles: ["admin", "org_admin", "payroll_manager"],
  },
  {
    id: "employee-hub",
    name: "Employee Hub",
    description: "Mobile app for employees to manage personal information, view contracts, and report daily attendance.",
    iconName: "Smartphone",
    colorIndex: 4,
    enabled: true,
    available: false,
    allowedRoles: ["admin", "org_admin", "hr_manager", "project_manager", "payroll_manager", "team_leader", "user"],
  },
  {
    id: "time-reporting",
    name: "Time & Status Reporting",
    description: "Report and track working hours per project and object. Manage daily time entries, approve timesheets, and generate attendance summaries.",
    iconName: "Clock",
    colorIndex: 6,
    enabled: true,
    available: false,
    allowedRoles: ["admin", "org_admin", "project_manager", "team_leader"],
  },
];

export function loadApps(): AppDefinition[] {
  try {
    const saved = localStorage.getItem("app-launcher-apps");
    if (!saved) return defaultApps;
    const parsed: AppDefinition[] = JSON.parse(saved);
    // Sync allowedRoles and adminOnly from defaults into saved apps
    const defaultMap = new Map(defaultApps.map((d) => [d.id, d]));
    const synced = parsed.map((app) => {
      const def = defaultMap.get(app.id);
      if (def) {
        return { ...app, allowedRoles: def.allowedRoles, adminOnly: def.adminOnly };
      }
      return app;
    });
    // Merge any new default apps that aren't in the saved list
    const savedIds = new Set(synced.map((a) => a.id));
    const missing = defaultApps.filter((d) => !savedIds.has(d.id));
    if (missing.length > 0) {
      const merged = [...synced, ...missing];
      localStorage.setItem("app-launcher-apps", JSON.stringify(merged));
      return merged;
    }
    // Save back synced roles
    localStorage.setItem("app-launcher-apps", JSON.stringify(synced));
    return synced;
  } catch {
    return defaultApps;
  }
}

function saveApps(apps: AppDefinition[]) {
  localStorage.setItem("app-launcher-apps", JSON.stringify(apps));
}

export function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Layers;
}

export function getColor(colorIndex: number) {
  return COLOR_OPTIONS[colorIndex % COLOR_OPTIONS.length];
}

export { COLOR_OPTIONS };

/** Returns true when running on the published production domain */
function isPublishedEnvironment(): boolean {
  const host = window.location.hostname;
  return host === "erptable.lovable.app" || host === "ljungaverkforestry.lovable.app";
}

// ─── Add/Edit Dialog ────────────────────────────────────────────────

interface AppFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (app: AppDefinition) => void;
  initial?: AppDefinition | null;
}

function AppFormDialog({ open, onClose, onSave, initial }: AppFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [iconName, setIconName] = useState(initial?.iconName ?? "Layers");
  const [colorIndex, setColorIndex] = useState(initial?.colorIndex ?? 0);
  const [launchUrl, setLaunchUrl] = useState(initial?.launchUrl ?? "");
  const [available, setAvailable] = useState(initial?.available ?? false);

  const isEdit = !!initial;

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const id = initial?.id ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    onSave({
      id,
      name: name.trim(),
      description: description.trim(),
      iconName,
      colorIndex,
      enabled: initial?.enabled ?? true,
      available: available,
      launchUrl: launchUrl.trim() || undefined,
    });
    onClose();
  };

  const PreviewIcon = getIcon(iconName);
  const previewColor = getColor(colorIndex);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Application" : "Add New Application"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", previewColor.bg)}>
              <PreviewIcon className={cn("w-5 h-5", previewColor.text)} />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">{name || "App Name"}</p>
              <p className="text-xs text-muted-foreground">Preview</p>
            </div>
          </div>
          <div>
            <Label>Application Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Application" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this application do?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Select value={iconName} onValueChange={setIconName}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ICON_MAP).map(([key, Icon]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{key}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <Select value={String(colorIndex)} onValueChange={(v) => setColorIndex(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c, i) => (
                    <SelectItem key={i} value={String(i)}>
                      <span className="flex items-center gap-2">
                        <span className={cn("w-3 h-3 rounded-full", c.bg, "border border-border")} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="mb-0">Available for launch</Label>
              <p className="text-xs text-muted-foreground">Toggle between "Coming Soon" and "Launch App"</p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
          <div>
            <Label>Launch URL (optional)</Label>
            <Input
              value={launchUrl}
              onChange={(e) => setLaunchUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
            <p className="text-xs text-muted-foreground mt-1">If set, launching this app will open this URL instead.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEdit ? "Save Changes" : "Add Application"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ──────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean;
  appName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteAppDialog({ open, appName, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove Application</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove <strong>{appName}</strong> from the launcher? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Remove</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Launcher ──────────────────────────────────────────────────

interface AppLauncherProps {
  onLaunchApp: (appId: string) => void;
  userRole?: string | null;
}

export function AppLauncher({ onLaunchApp, userRole }: AppLauncherProps) {
  const [apps, setApps] = useState<AppDefinition[]>(loadApps);
  const [editMode, setEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppDefinition | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<AppDefinition | null>(null);
  const [teaserApp, setTeaserApp] = useState<AppDefinition | null>(null);

  const isProduction = isPublishedEnvironment();
  // Fetch role-based app access from database
  const [roleAccess, setRoleAccess] = useState<Set<string>>(new Set());
  const [accessLoaded, setAccessLoaded] = useState(false);

  useEffect(() => {
    if (!userRole) return;
    supabase
      .from("role_app_access")
      .select("app_id")
      .eq("role", userRole)
      .then(({ data }) => {
        if (data) setRoleAccess(new Set(data.map((r: any) => r.app_id)));
        setAccessLoaded(true);
      });
  }, [userRole]);

  const visibleApps = (editMode ? apps : apps.filter((a) => a.enabled)).filter((a) => {
    if (editMode) return true;
    if (a.adminOnly && userRole !== "admin") return false;
    // Use database-driven access if loaded
    if (accessLoaded && userRole) {
      return roleAccess.has(a.id);
    }
    // Fallback to hardcoded allowedRoles
    if (a.allowedRoles && a.allowedRoles.length > 0 && userRole) {
      return a.allowedRoles.includes(userRole);
    }
    return true;
  });

  const updateApps = (updated: AppDefinition[]) => {
    setApps(updated);
    saveApps(updated);
  };

  const toggleApp = (id: string) => {
    updateApps(apps.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const handleAddApp = (app: AppDefinition) => {
    if (apps.find((a) => a.id === app.id)) {
      toast({ title: "An app with this name already exists", variant: "destructive" });
      return;
    }
    updateApps([...apps, app]);
    toast({ title: `${app.name} added to launcher` });
  };

  const handleEditApp = (app: AppDefinition) => {
    updateApps(apps.map((a) => (a.id === editingApp?.id ? { ...a, ...app, id: a.id } : a)));
    setEditingApp(null);
    toast({ title: `${app.name} updated` });
  };

  const handleDeleteApp = () => {
    if (!deletingApp) return;
    updateApps(apps.filter((a) => a.id !== deletingApp.id));
    toast({ title: `${deletingApp.name} removed` });
    setDeletingApp(null);
    setDeleteOpen(false);
  };

  const handleLaunch = (app: AppDefinition) => {
    if (editMode) return;
    if (app.launchUrl) {
      window.open(app.launchUrl, "_blank");
      return;
    }
    if (!app.available) {
      setTeaserApp(app);
      return;
    }
    onLaunchApp(app.id);
  };

  // ── Drag & drop ──
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
        const cards = Array.from(containerRef.current.querySelectorAll("[data-app-card]")) as HTMLElement[];
        let newOver = cards.length - 1;
        for (let i = 0; i < cards.length; i++) {
          const rect = cards[i].getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          if (ev.clientY < rect.bottom && ev.clientX < midX) { newOver = i; break; }
          if (ev.clientY < rect.top) { newOver = i; break; }
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
          const newItems = [...apps];
          const [moved] = newItems.splice(from, 1);
          newItems.splice(to, 0, moved);
          updateApps(newItems);
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
    <div className="min-h-screen bg-muted/30 flex flex-col items-center p-6 pt-16">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Application Launcher</h1>
            <p className="text-muted-foreground">Choose an application to continue</p>
          </div>
          <div className="flex gap-2">
            {/* Dev-only buttons: Customize, Home */}
            {!isProduction && (
              <>
                {editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingApp(null); setFormOpen(true); }}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add App
                  </Button>
                )}
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  {editMode ? "Done" : "Customize"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://ljungaverkforestry.lovable.app", "_blank")}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Home
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
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
              }}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </div>
        </div>

        {/* App Grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
        >
          {visibleApps.map((app, index) => {
            const Icon = getIcon(app.iconName);
            const color = getColor(app.colorIndex);

            return (
              <div
                key={app.id}
                data-app-card
                onPointerDown={(e) => handlePointerDown(e, index)}
                onClick={() => handleLaunch(app)}
                className={cn(
                  "group relative bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col items-center text-center transition-all duration-200 select-none",
                  !editMode && app.available && "cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                  !editMode && !app.available && "cursor-default",
                  !app.enabled && "opacity-50",
                  dragIndex === index && "opacity-40 scale-95",
                  overIndex === index && dragIndex !== null && dragIndex !== index && "ring-2 ring-primary/40"
                )}
              >
                {/* Edit mode controls (dev only) */}
                {editMode && !isProduction && (
                  <div className="absolute top-2 right-2 flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleApp(app.id); }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title={app.enabled ? "Hide" : "Show"}
                    >
                      {app.enabled ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingApp(app); setFormOpen(true); }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingApp(app); setDeleteOpen(true); }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                    <span
                      data-grip
                      className="p-1.5 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing transition-colors"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </span>
                  </div>
                )}

                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", color.bg)}>
                  <Icon className={cn("w-6 h-6", color.text)} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{app.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{app.description}</p>
                <div className="mt-auto">
                  {app.available ? (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors",
                      !editMode && "group-hover:underline"
                    )}>
                      Launch App <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/60">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            All applications share common employee data and resources.
          </p>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      {formOpen && (
        <AppFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingApp(null); }}
          onSave={editingApp ? handleEditApp : handleAddApp}
          initial={editingApp}
        />
      )}

      {/* Delete Confirm */}
      {deleteOpen && deletingApp && (
        <DeleteAppDialog
          open={deleteOpen}
          appName={deletingApp.name}
          onClose={() => { setDeleteOpen(false); setDeletingApp(null); }}
          onConfirm={handleDeleteApp}
        />
      )}

      {/* Teaser Dialog */}
      <TeaserDialog
        app={teaserApp}
        open={!!teaserApp}
        onClose={() => setTeaserApp(null)}
      />
    </div>
  );
}
