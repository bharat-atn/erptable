import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Smartphone } from "lucide-react";

interface CameraPermissionHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
}

function detectDevice(): "ios" | "android" | "other" {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

const iosSteps = [
  "Open the **Settings** app on your iPhone",
  "Scroll down and tap **Safari** (or the browser you're using, e.g. Chrome)",
  "Tap **Camera** and select **Allow**",
  "Go back to this app and tap **Retry** below",
];

const iosSafariQuick = [
  "In Safari, tap the **aA** button in the address bar",
  "Tap **Website Settings**",
  "Set **Camera** to **Allow**",
  "Reload the page or tap **Retry** below",
];

const androidChromeSteps = [
  "In Chrome, tap the **lock icon 🔒** (or ⓘ) in the address bar",
  "Tap **Permissions** or **Site settings**",
  "Find **Camera** and set it to **Allow**",
  "Go back to this app and tap **Retry** below",
];

const androidSettingsSteps = [
  "Open your phone's **Settings** app",
  "Tap **Apps** → find your browser (e.g. Chrome)",
  "Tap **Permissions** → **Camera** → **Allow**",
  "Go back to this app and tap **Retry** below",
];

function StepList({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
              {i + 1}
            </span>
            <span
              className="pt-0.5 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
              }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CameraPermissionHelp({ open, onOpenChange, onRetry }: CameraPermissionHelpProps) {
  const device = detectDevice();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="w-5 h-5 text-primary" />
            How to Allow Camera Access
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This app needs your camera to take verification photos when clocking in and out. 
            Follow the steps below for your device:
          </p>

          {device === "ios" && (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Smartphone className="w-4 h-4" /> iPhone / iPad
              </div>
              <StepList title="Quick fix (Safari):" steps={iosSafariQuick} />
              <div className="border-t border-border/40 pt-3">
                <StepList title="From Settings app:" steps={iosSteps} />
              </div>
            </>
          )}

          {device === "android" && (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Smartphone className="w-4 h-4" /> Android
              </div>
              <StepList title="Quick fix (Chrome):" steps={androidChromeSteps} />
              <div className="border-t border-border/40 pt-3">
                <StepList title="From Settings app:" steps={androidSettingsSteps} />
              </div>
            </>
          )}

          {device === "other" && (
            <>
              <div className="bg-muted/40 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-foreground">iPhone / iPad (Safari)</p>
                <StepList title="" steps={iosSafariQuick} />
              </div>
              <div className="bg-muted/40 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-foreground">Android (Chrome)</p>
                <StepList title="" steps={androidChromeSteps} />
              </div>
            </>
          )}

          <Button onClick={() => { onRetry(); onOpenChange(false); }} className="w-full">
            <Camera className="w-4 h-4 mr-2" />
            Retry Camera
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
