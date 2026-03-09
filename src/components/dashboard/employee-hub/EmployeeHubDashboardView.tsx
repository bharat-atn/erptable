import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  LogIn,
  LogOut,
  Clock,
  MapPin,
  CheckCircle2,
  Image,
  Calendar,
  FileText,
  Navigation,
  Shield,
  ShieldAlert,
  Wifi,
  Activity,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGeolocation, isInsideGeofence, type GeoLocation, type GeofenceZone } from "./useGeolocation";
import { useTimeEntries, type TimeEntry } from "./useTimeEntries";
import { useWorksiteGeofence } from "./useWorksiteGeofence";
import { CameraPermissionHelp } from "./CameraPermissionHelp";

const DEFAULT_WORKSITE_RADIUS_METERS = 250;

interface PhotoCapture {
  selfie: string | null;
  environment: string | null;
}

function formatElapsed(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function LocationBadge({ location, zones }: { location: GeoLocation | null; zones: GeofenceZone[] }) {
  if (!location) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
        <Wifi className="w-4 h-4 shrink-0 opacity-40" />
        <span>Location not captured yet</span>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs rounded-xl p-3 border bg-muted/30 border-border/40 text-muted-foreground">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-semibold">Work area not configured yet</span>
          <p className="text-[10px] opacity-70 mt-0.5">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} (±{Math.round(location.accuracy)}m)
          </p>
        </div>
      </div>
    );
  }

  const matchedZone = zones.find((z) => isInsideGeofence(location, z));

  return (
    <div
      className={`flex items-center gap-2 text-xs rounded-xl p-3 border ${
        matchedZone
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-600/20 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-50 dark:bg-amber-950/20 border-amber-500/20 text-amber-700 dark:text-amber-400"
      }`}
    >
      {matchedZone ? (
        <>
          <Shield className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-semibold">Inside work area:</span> {matchedZone.name}
            <p className="text-[10px] opacity-70 mt-0.5">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} (±{Math.round(location.accuracy)}m)
            </p>
          </div>
        </>
      ) : (
        <>
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-semibold">Outside configured work area</span>
            <p className="text-[10px] opacity-70 mt-0.5">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} (±{Math.round(location.accuracy)}m)
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function TimeEntryRow({ entry }: { entry: TimeEntry }) {
  const isIn = entry.type === "clock_in";
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isIn ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"
        }`}
      >
        {isIn ? (
          <LogIn className="w-4 h-4 text-emerald-600" />
        ) : (
          <LogOut className="w-4 h-4 text-rose-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{isIn ? "Clock In" : "Clock Out"}</p>
        <p className="text-[10px] text-muted-foreground">
          {entry.timestamp.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {entry.location && (
            <span className="ml-1">• {entry.insideGeofence ? "✅ In area" : "⚠️ Outside area"}</span>
          )}
        </p>
      </div>
      {entry.selfieUrl && (
        <img src={entry.selfieUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-border/30" />
      )}
    </div>
  );
}

export function EmployeeHubDashboardView() {
  const { requestLocation } = useGeolocation();
  const { todayEntries, addEntry, isClockedIn, todayWorkedMs } = useTimeEntries();
  const { zone: worksiteZone, zones: worksiteZones, calibrateFromLocation } = useWorksiteGeofence(
    DEFAULT_WORKSITE_RADIUS_METERS
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"in" | "out">("in");
  const [photos, setPhotos] = useState<PhotoCapture>({ selfie: null, environment: null });
  const [activeCamera, setActiveCamera] = useState<"selfie" | "environment" | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<GeoLocation | null>(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [cameraHelpOpen, setCameraHelpOpen] = useState(false);
  const [lastCameraMode, setLastCameraMode] = useState<"selfie" | "environment">("selfie");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startCamera = useCallback(async (mode: "selfie" | "environment") => {
    setLastCameraMode(mode);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera is not available. Make sure you're using HTTPS.", { duration: 5000 });
        return;
      }

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
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      if (error.name === "NotAllowedError") {
        setCameraHelpOpen(true);
      } else if (error.name === "NotFoundError") {
        toast.error("No camera found on this device.", { duration: 5000 });
      } else if (error.name === "NotReadableError" || error.name === "AbortError") {
        toast.error("Camera is in use by another app. Close other apps using the camera and try again.", { duration: 6000 });
      } else {
        toast.error(`Camera error: ${error.message}`, { duration: 5000 });
      }
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

  const handleOpenDialog = async (mode: "in" | "out") => {
    setDialogMode(mode);
    setPhotos({ selfie: null, environment: null });
    setCapturedLocation(null);
    setDialogOpen(true);

    // Auto-fetch location when dialog opens
    setLocationFetching(true);
    try {
      const loc = await requestLocation();
      setCapturedLocation(loc);

      // Auto-calibrate the worksite zone on first use (single-site setup)
      if (!worksiteZone) {
        calibrateFromLocation(loc, "Work site");
      }
    } catch {
      // Error handled by hook
    } finally {
      setLocationFetching(false);
    }
  };

  const handleSubmit = () => {
    if (!photos.selfie || !photos.environment) {
      toast.error("Please capture both photos before submitting.");
      return;
    }

    const insideGeofence =
      capturedLocation && worksiteZone ? isInsideGeofence(capturedLocation, worksiteZone) : null;

    addEntry({
      type: dialogMode === "in" ? "clock_in" : "clock_out",
      timestamp: new Date(),
      location: capturedLocation,
      selfieUrl: photos.selfie,
      environmentUrl: photos.environment,
      insideGeofence,
    });

    if (dialogMode === "in") {
      toast.success(
        insideGeofence === false ? "Clocked in (outside work area — flagged for review)" : "Clocked in successfully!",
        { duration: 3000 }
      );
    } else {
      toast.success("Clocked out successfully!");
    }

    setDialogOpen(false);
    stopCamera();
  };

  const elapsed = isClockedIn ? formatElapsed(todayWorkedMs) : null;

  return (
    <div className="space-y-5 px-4 pt-2 pb-24">
      {/* Hero section with live clock */}
      <div className="relative rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-6 -mb-6" />
        <div className="relative">
          <p className="text-xs text-white/80 capitalize mb-1">{dateStr}</p>
          <h1 className="text-4xl font-bold tracking-tight font-mono mb-4">{timeStr}</h1>
          {isClockedIn ? (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Activity className="w-4 h-4 animate-pulse" />
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
      <div className="flex justify-center -mt-8 mb-2">
        {!isClockedIn ? (
          <button
            onClick={() => handleOpenDialog("in")}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-1.5 ring-4 ring-emerald-600/20"
          >
            <LogIn className="w-7 h-7" />
            <span className="text-xs font-bold">Clock In</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenDialog("out")}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-1.5 ring-4 ring-rose-600/20"
          >
            <LogOut className="w-7 h-7" />
            <span className="text-xs font-bold">Clock Out</span>
          </button>
        )}
      </div>

      {/* Today's schedule */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Clock className="w-4 h-4" /> Today's Schedule
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">Start</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">06:30</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">End</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">17:00</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">Worked</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">
              {isClockedIn ? formatElapsed(todayWorkedMs) : "0h"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 text-emerald-700 dark:text-emerald-500">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors active:scale-95">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium text-center">Schedule</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors active:scale-95">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium text-center">Contracts</span>
          </button>
          <button
            onClick={async () => {
              try {
                const loc = await requestLocation();
                toast.success(`Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
              } catch {}
            }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors active:scale-95"
          >
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium text-center">My Location</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Activity className="w-4 h-4" /> Today's Activity
        </h3>
        {todayEntries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No time entries recorded today</p>
            <p className="text-[10px] mt-0.5 opacity-60">Clock in to start recording</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Photo Capture Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            stopCamera();
            setDialogOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] rounded-3xl border-2 border-emerald-600/20">
          <DialogHeader>
            <DialogTitle className="text-base text-emerald-700 dark:text-emerald-500">
              {dialogMode === "in" ? "Clock In — Stämpla in" : "Clock Out — Stämpla ut"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Take a selfie and a photo of your work environment. Your GPS location is captured automatically.
            </p>

            {/* Location status in dialog */}
            {locationFetching ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3 animate-pulse">
                <Navigation className="w-4 h-4 animate-spin" />
                <span>Acquiring GPS location…</span>
              </div>
            ) : (
              <LocationBadge location={capturedLocation} zones={worksiteZones} />
            )}

            {/* Camera preview */}
            {activeCamera && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-lg">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="rounded-full w-14 h-14 bg-white hover:bg-white/90 shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6 text-emerald-600" />
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
                className="relative aspect-square rounded-2xl border-2 border-dashed border-emerald-600/30 hover:border-emerald-600/60 active:border-emerald-600 transition-colors overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/10 min-h-[100px]"
              >
                {photos.selfie ? (
                  <>
                    <img src={photos.selfie} alt="Selfie" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Camera className="w-8 h-8 mx-auto text-emerald-600/40 mb-1" />
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500">Selfie</p>
                  </div>
                )}
              </button>

              <button
                onClick={() => !photos.environment && startCamera("environment")}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-emerald-600/30 hover:border-emerald-600/60 active:border-emerald-600 transition-colors overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/10 min-h-[100px]"
              >
                {photos.environment ? (
                  <>
                    <img src={photos.environment} alt="Environment" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Image className="w-8 h-8 mx-auto text-emerald-600/40 mb-1" />
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500">Environment</p>
                  </div>
                )}
              </button>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="h-12 sm:h-10 rounded-xl"
              onClick={() => {
                stopCamera();
                setDialogOpen(false);
              }}
            >
              Cancel
            </Button>
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

      <CameraPermissionHelp
        open={cameraHelpOpen}
        onOpenChange={setCameraHelpOpen}
        onRetry={() => startCamera(lastCameraMode)}
      />
    </div>
  );
}
