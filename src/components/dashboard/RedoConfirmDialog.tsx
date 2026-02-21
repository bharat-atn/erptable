import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";

interface RedoConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  description?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RedoConfirmDialog({
  open,
  onOpenChange,
  itemName,
  description,
  onConfirm,
  isLoading,
}: RedoConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const canConfirm = typedValue === "REDO";

  const handleOpenChange = (v: boolean) => {
    if (!v) setTypedValue("");
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-950/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500">
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-amber-800 dark:text-amber-300 text-base font-bold mb-0.5">
                Reset Contract for Re-signing
              </AlertDialogTitle>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 font-medium">
                All signatures will be cleared so the contract can be edited and re-signed.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-foreground">
              You are about to reset:
            </p>
            <p className="text-sm font-bold text-foreground mt-1">
              {itemName}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              🔄 The contract will return to <span className="font-bold">draft</span> status.
              All existing signatures will be removed. You can then edit the contract,
              re-send it for employee signing, and counter-sign again.
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-foreground">
                Type <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">REDO</span> to confirm:
              </p>
              <Input
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value.toUpperCase())}
                placeholder="Type REDO here"
                className="border-amber-300 focus-visible:ring-amber-400/30"
                autoFocus
              />
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
          <Button
            variant="default"
            onClick={() => { onConfirm(); setTypedValue(""); }}
            disabled={isLoading || !canConfirm}
            className="flex-1 font-semibold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RotateCcw className="w-4 h-4" />
            {isLoading ? "Resetting..." : "Yes, Redo Contract"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
