import { Check, Pencil, Trash2 } from "lucide-react";
import type { CompGroup } from "./types";

interface GroupChipsProps {
  groups: CompGroup[];
  activeGroupId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function GroupChips({ groups, activeGroupId, onSelect, onRename, onDelete }: GroupChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {groups.map(g => {
        const isActive = g.id === activeGroupId;
        return (
          <div
            key={g.id}
            className={`inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:bg-accent"
            }`}
            onClick={() => onSelect(g.id)}
          >
            {isActive && <Check className="w-3.5 h-3.5" />}
            <span className="mr-1">{g.name}</span>
            <button
              className="p-0.5 rounded-full hover:bg-background/20"
              onClick={e => { e.stopPropagation(); onRename(g.id, g.name); }}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              className="p-0.5 rounded-full hover:bg-destructive/20 text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(g.id); }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
