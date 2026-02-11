import { useState } from "react";
import { cn } from "@/lib/utils";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenSize {
  label: string;
  width: number | null; // null = full/no constraint
  description: string;
}

const screenSizes: ScreenSize[] = [
  { label: "14\"", width: 1366, description: "14\" Laptop" },
  { label: "16\"", width: 1536, description: "16\" Laptop" },
  { label: "24\"", width: 1920, description: "24\" Monitor" },
  { label: "27\"", width: 2560, description: "27\" Monitor" },
  { label: "Full", width: null, description: "Full width" },
];

interface ScreenSizeSimulatorProps {
  children: React.ReactNode;
}

export function ScreenSizeSimulator({ children }: ScreenSizeSimulatorProps) {
  const [activeSize, setActiveSize] = useState<ScreenSize>(screenSizes[screenSizes.length - 1]);
  const [visible, setVisible] = useState(true);

  const isConstrained = activeSize.width !== null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-muted/30">
      {/* Size picker bar */}
      {visible && (
        <div className="sticky top-0 z-50 w-full flex justify-center py-2 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-card border shadow-sm">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Screen Size</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {screenSizes.map((size) => (
                <Button
                  key={size.label}
                  variant={activeSize.label === size.label ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 px-3 text-xs font-medium rounded-md",
                    activeSize.label === size.label
                      ? "shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveSize(size)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
            {isConstrained && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {activeSize.width}px
              </span>
            )}
          </div>
        </div>
      )}

      {/* Constrained container */}
      <div
        className={cn(
          "w-full transition-all duration-300 ease-out",
          isConstrained && "shadow-xl border-x border-border/50"
        )}
        style={{
          maxWidth: isConstrained ? `${activeSize.width}px` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
