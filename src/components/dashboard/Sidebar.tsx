import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "Employees", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
  { id: "contracts", label: "Contracts", icon: FileText },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display font-bold text-lg">OnboardFlow</h1>
            <p className="text-xs text-muted-foreground">HR Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              activeView === item.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm animate-fade-in">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
