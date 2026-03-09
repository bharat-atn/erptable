import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, LogIn, LogOut, Clock, MapPin, CheckCircle2, Image, Calendar, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type ClockStatus = "clocked_out" | "clocked_in";

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
    <div className="space-y-5 px-2 pt-2 pb-24 max-w-lg mx-auto">
      {/* Hero section with clock */}
      <div className="relative rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-6 -mb-6" />
        <div className="relative">
          <p className="text-xs text-white/80 capitalize mb-1">{dateStr}</p>
          <h1 className="text-5xl font-bold tracking-tight mb-4">{timeStr}</h1>
          {status === "clocked_in" ? (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">On duty • {elapsed}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Off duty</span>
            </div>
          )}
        </div>
      </div>

      {/* Clock In / Out Button */}
      <div className="flex justify-center -mt-8 mb-4">
        {status === "clocked_out" ? (
          <button
            onClick={() => handleOpenDialog("in")}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-2"
          >
            <LogIn className="w-8 h-8" />
            <span className="text-sm font-bold">Clock In</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenDialog("out")}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-2"
          >
            <LogOut className="w-8 h-8" />
            <span className="text-sm font-bold">Clock Out</span>
          </button>
        )}
      </div>

      {/* Today's schedule */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Clock className="w-4 h-4" /> Today's Schedule
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">Start</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">06:30</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">End</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">17:00</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">Hours</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">8.0</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4 text-emerald-700 dark:text-emerald-500">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <span className="text-xs font-medium text-center">Schedule</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span className="text-xs font-medium text-center">Contracts</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span className="text-xs font-medium text-center">Location</span>
          </button>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4 text-emerald-700 dark:text-emerald-500">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No time entries recorded yet</p>
          <p className="text-xs mt-1">Clock in to start recording your work time</p>
        </div>
      </div>

      {/* Photo Capture Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { stopCamera(); setDialogOpen(false); } }}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] rounded-3xl border-2 border-emerald-600/20">
          <DialogHeader>
            <DialogTitle className="text-base text-emerald-700 dark:text-emerald-500">
              {dialogMode === "in" ? "Clock In — Stämpla in" : "Clock Out — Stämpla ut"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a selfie and a photo of your work environment to confirm attendance.
            </p>

            {/* Camera preview */}
            {activeCamera && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-lg">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button onClick={capturePhoto} className="rounded-full w-16 h-16 bg-white hover:bg-white/90 shadow-2xl active:scale-95 transition-transform flex items-center justify-center">
                    <Camera className="w-7 h-7 text-emerald-600" />
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {activeCamera === "selfie" ? "📸 Selfie" : "🏞️ Environment"}
                </div>
              </div>
            )}

            {/* Photo slots */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => !photos.selfie && startCamera("selfie")}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-emerald-600/30 hover:border-emerald-600/60 active:border-emerald-600 transition-colors overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/10 min-h-[120px]"
              >
                {photos.selfie ? (
                  <>
                    <img src={photos.selfie} alt="Selfie" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Camera className="w-10 h-10 mx-auto text-emerald-600/40 mb-2" />
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-500">Selfie</p>
                    <p className="text-[10px] text-muted-foreground">Tap to capture</p>
                  </div>
                )}
              </button>

              <button
                onClick={() => !photos.environment && startCamera("environment")}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-emerald-600/30 hover:border-emerald-600/60 active:border-emerald-600 transition-colors overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/10 min-h-[120px]"
              >
                {photos.environment ? (
                  <>
                    <img src={photos.environment} alt="Environment" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Image className="w-10 h-10 mx-auto text-emerald-600/40 mb-2" />
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-500">Environment</p>
                    <p className="text-[10px] text-muted-foreground">Tap to capture</p>
                  </div>
                )}
              </button>
            </div>

            {/* Location info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-600/20">
              <MapPin className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Location will be recorded automatically</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="h-12 sm:h-10 rounded-xl" onClick={() => { stopCamera(); setDialogOpen(false); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!photos.selfie || !photos.environment}
              className={`h-12 sm:h-10 rounded-xl ${dialogMode === "in" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            >
              {dialogMode === "in" ? "Confirm Clock In" : "Confirm Clock Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
