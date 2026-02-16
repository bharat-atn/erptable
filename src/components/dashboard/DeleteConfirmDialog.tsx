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
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Name/label of the item being deleted — shown in bold */
  itemName: string;
  /** Extra context about consequences */
  description?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  /** If true, user must type "DELETE" to confirm */
  requireTypedConfirmation?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  itemName,
  description,
  onConfirm,
  isLoading,
  requireTypedConfirmation = false,
}: DeleteConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const canConfirm = !requireTypedConfirmation || typedValue === "DELETE";

  const handleOpenChange = (v: boolean) => {
    if (!v) setTypedValue("");
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader className="space-y-4">
          {/* Red warning banner */}
          <div className="flex items-center gap-3 rounded-lg border-2 border-destructive/30 bg-destructive/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div>
              <AlertDialogTitle className="text-destructive text-base font-bold mb-0.5">
                {title}
              </AlertDialogTitle>
              <p className="text-sm text-destructive/80 font-medium">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          {/* Item details */}
          <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-foreground">
              You are about to permanently delete:
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

          {/* Warning text */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              ⚠️ All associated data will be permanently removed from the system. 
              There is <span className="font-bold text-destructive">no way to recover</span> this 
              data once deleted.
            </p>

            {requireTypedConfirmation && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-medium text-foreground">
                  Type <span className="font-bold text-destructive font-mono">DELETE</span> to confirm:
                </p>
                <Input
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  placeholder="Type DELETE here"
                  className="border-destructive/30 focus-visible:ring-destructive/30"
                  autoFocus
                />
              </div>
            )}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="flex-1">Cancel — Keep it safe</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => { onConfirm(); setTypedValue(""); }}
            disabled={isLoading || !canConfirm}
            className="flex-1 font-semibold gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {isLoading ? "Deleting..." : "Yes, Delete Permanently"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
