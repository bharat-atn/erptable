import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, LogIn, LogOut, Clock, MapPin, CheckCircle2, AlertCircle, Loader2, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type ClockStatus = "clocked_out" | "clocking_in" | "clocked_in" | "clocking_out";

interface PhotoCapture {
  selfie: string | null;
  environment: string | null;
}

export function EmployeeHubDashboardView() {
  const [status, setStatus] = useState<ClockStatus>("clocked_out");
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"in" | "out">("in");
  const [photos, setPhotos] = useState<PhotoCapture>({ selfie: null, environment: null });
  const [activeCamera, setActiveCamera] = useState<"selfie" | "environment" | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const startCamera = useCallback(async (mode: "selfie" | "environment") => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode === "selfie" ? "user" : "environment", width: 640, height: 480 },
      });
      setStream(s);
      setActiveCamera(mode);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setActiveCamera(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !activeCamera) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotos((prev) => ({ ...prev, [activeCamera]: dataUrl }));
    stopCamera();
  }, [activeCamera, stopCamera]);

  const handleOpenDialog = (mode: "in" | "out") => {
    setDialogMode(mode);
    setPhotos({ selfie: null, environment: null });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!photos.selfie || !photos.environment) {
      toast.error("Please capture both photos before submitting.");
      return;
    }
    if (dialogMode === "in") {
      setStatus("clocked_in");
      setClockInTime(new Date());
      toast.success("Clocked in successfully!");
    } else {
      setStatus("clocked_out");
      setClockInTime(null);
      toast.success("Clocked out successfully!");
    }
    setDialogOpen(false);
    stopCamera();
  };

  const elapsed = clockInTime
    ? `${Math.floor((now.getTime() - clockInTime.getTime()) / 3600000)}h ${Math.floor(((now.getTime() - clockInTime.getTime()) % 3600000) / 60000)}m`
    : null;

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        <h1 className="text-5xl font-bold text-foreground tracking-tight mt-1">{timeStr}</h1>
        <div className="mt-3">
          {status === "clocked_in" ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-sm px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> On duty • {elapsed}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-sm px-3 py-1">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Off duty
            </Badge>
          )}
        </div>
      </div>

      {/* Clock In / Out Button */}
      <div className="flex justify-center">
        {status === "clocked_out" ? (
          <Button
            size="lg"
            className="h-20 w-64 rounded-2xl text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            onClick={() => handleOpenDialog("in")}
          >
            <LogIn className="w-6 h-6 mr-3" />
            Clock In
          </Button>
        ) : (
          <Button
            size="lg"
            variant="destructive"
            className="h-20 w-64 rounded-2xl text-lg font-semibold shadow-lg"
            onClick={() => handleOpenDialog("out")}
          >
            <LogOut className="w-6 h-6 mr-3" />
            Clock Out
          </Button>
        )}
      </div>

      {/* Today's schedule summary */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Today's Schedule
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Start</p>
              <p className="text-lg font-bold">06:30</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">End</p>
              <p className="text-lg font-bold">17:00</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Hours</p>
              <p className="text-lg font-bold">8.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No time entries recorded yet</p>
            <p className="text-xs mt-1">Clock in to start recording your work time</p>
          </div>
        </CardContent>
      </Card>

      {/* Photo Capture Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { stopCamera(); setDialogOpen(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "in" ? "Clock In — Stämpla in" : "Clock Out — Stämpla ut"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a selfie and a photo of your work environment to confirm attendance.
            </p>

            {/* Camera preview */}
            {activeCamera && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <Button onClick={capturePhoto} className="rounded-full w-14 h-14 bg-white hover:bg-white/90 shadow-xl">
                    <Camera className="w-6 h-6 text-black" />
                  </Button>
                </div>
                <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0">
                  {activeCamera === "selfie" ? "📸 Selfie" : "🏞️ Environment"}
                </Badge>
              </div>
            )}

            {/* Photo slots */}
            <div className="grid grid-cols-2 gap-3">
              {/* Selfie */}
              <button
                onClick={() => !photos.selfie && startCamera("selfie")}
                className="relative aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center bg-muted/30"
              >
                {photos.selfie ? (
                  <>
                    <img src={photos.selfie} alt="Selfie" className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Done
                    </Badge>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Camera className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                    <p className="text-xs font-medium text-muted-foreground">Selfie</p>
                    <p className="text-[10px] text-muted-foreground">Tap to capture</p>
                  </div>
                )}
              </button>

              {/* Environment */}
              <button
                onClick={() => !photos.environment && startCamera("environment")}
                className="relative aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center bg-muted/30"
              >
                {photos.environment ? (
                  <>
                    <img src={photos.environment} alt="Environment" className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Done
                    </Badge>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Image className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                    <p className="text-xs font-medium text-muted-foreground">Environment</p>
                    <p className="text-[10px] text-muted-foreground">Tap to capture</p>
                  </div>
                )}
              </button>
            </div>

            {/* Location info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Location will be recorded automatically</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { stopCamera(); setDialogOpen(false); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!photos.selfie || !photos.environment}
              className={dialogMode === "in" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {dialogMode === "in" ? "Confirm Clock In" : "Confirm Clock Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
