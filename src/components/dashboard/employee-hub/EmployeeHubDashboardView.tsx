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
  RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGeolocation, isInsideGeofence, type GeoLocation, type GeofenceZone } from "./useGeolocation";
import { useTimeEntries, type TimeEntry } from "./useTimeEntries";
import { useWorksiteGeofence } from "./useWorksiteGeofence";
import { CameraPermissionHelp } from "./CameraPermissionHelp";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

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

function LocationBadge({ location, zones, t }: { location: GeoLocation | null; zones: GeofenceZone[]; t?: (key: string) => string }) {
  if (!location) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
        <Wifi className="w-4 h-4 shrink-0 opacity-40" />
        <span>{t ? t("hub.locationNotCaptured") : "Location not captured yet"}</span>
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

function TimeEntryRow({ entry, t }: { entry: TimeEntry; t: (key: string) => string }) {
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
        <p className="text-sm font-semibold">{isIn ? t("hub.clockIn") : t("hub.clockOut")}</p>
        <p className="text-[10px] text-muted-foreground">
          {entry.timestamp.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {entry.location && (
            <span className="ml-1">• {entry.insideGeofence ? `✅ ${t("hub.inArea")}` : `⚠️ ${t("hub.outsideArea")}`}</span>
          )}
        </p>
      </div>
      {entry.selfieUrl && (
        <img src={entry.selfieUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-border/30" />
      )}
    </div>
  );
}

/**
 * Attempt getUserMedia with simple constraints first, then fallback to bare {video:true}.
 * This avoids OverconstrainedError on iOS devices with non-standard aspect ratios.
 */
async function acquireCamera(facingMode: "user" | "environment"): Promise<MediaStream> {
  // On some mobile browsers, mediaDevices may exist but getUserMedia may not
  const gum =
    navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ??
    // Legacy fallback for older mobile browsers
    (navigator as any).getUserMedia?.bind(navigator) ??
    (navigator as any).webkitGetUserMedia?.bind(navigator);

  if (!gum) {
    throw Object.assign(
      new Error("Camera is not supported on this browser. Try using Safari (iPhone) or Chrome (Android)."),
      { name: "NoCameraSupport" }
    );
  }

  // First attempt — simple facingMode, no resolution constraints
  try {
    return await gum({ video: { facingMode } });
  } catch (err) {
    const e = err instanceof Error ? err : new Error("Unknown");
    // If overconstrained or not found (e.g. no front camera), try bare video
    if (e.name === "OverconstrainedError" || e.name === "NotFoundError") {
      return await gum({ video: true });
    }
    throw err;
  }
}

interface EmployeeHubDashboardViewProps {
  t: (key: string) => string;
}

export function EmployeeHubDashboardView({ t }: EmployeeHubDashboardViewProps) {
  const { requestLocation } = useGeolocation();
  const { orgId } = useOrg();

  // Resolve employee_id for the current user
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !orgId) return;
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("org_id", orgId)
        .eq("email", user.email)
        .maybeSingle();
      if (data) setEmployeeId(data.id);
    })();
  }, [orgId]);

  const { todayEntries, addEntry, isClockedIn, todayWorkedMs } = useTimeEntries(employeeId, orgId);
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

  /** Attach a MediaStream to the video element, retrying via rAF if not mounted yet */
  const attachStreamToVideo = useCallback((s: MediaStream) => {
    const attach = () => {
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      } else {
        requestAnimationFrame(attach);
      }
    };
    requestAnimationFrame(attach);
  }, []);

  /** Start camera for a given mode — must be called from a user-gesture context */
  const startCamera = useCallback(async (mode: "selfie" | "environment") => {
    setLastCameraMode(mode);
    try {
      // CRITICAL: getUserMedia is the FIRST await — preserves iOS Safari user-gesture context
      const s = await acquireCamera(mode === "selfie" ? "user" : "environment");
      setStream(s);
      setActiveCamera(mode);
      attachStreamToVideo(s);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      if (error.name === "NotAllowedError" || error.name === "NotPermittedError") {
        // Show device-specific help
        setCameraHelpOpen(true);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          toast.error("Camera blocked. On iPhone: Settings → Safari → Camera → Allow.", { duration: 7000 });
        } else {
          toast.error("Camera permission denied. Check your browser settings to allow camera access.", { duration: 6000 });
        }
      } else if (error.name === "NotFoundError") {
        toast.error("No camera found on this device.", { duration: 5000 });
      } else if (error.name === "NotReadableError" || error.name === "AbortError") {
        toast.error("Camera is in use by another app. Close other apps and try again.", { duration: 6000 });
      } else {
        toast.error(`Camera error: ${error.message}`, { duration: 5000 });
      }
    }
  }, [attachStreamToVideo]);

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

  /**
   * CHANGE 1: Start camera IMMEDIATELY on button tap (single gesture).
   * getUserMedia is the FIRST await — before dialog open or GPS fetch.
   * This preserves the user-gesture context required by iOS Safari.
   */
  const handleOpenDialog = async (mode: "in" | "out") => {
    setDialogMode(mode);
    setPhotos({ selfie: null, environment: null });
    setCapturedLocation(null);

    // CRITICAL: getUserMedia MUST be the first await in this click handler.
    // iOS Safari requires a direct user-gesture context for camera access.
    let cameraStream: MediaStream | null = null;
    try {
      cameraStream = await acquireCamera("user");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown");
      if (error.name === "NotAvailableInPreview") {
        toast.error("Camera is not available in the preview. Open the published app URL on your phone.", { duration: 8000 });
      } else if (error.name === "InsecureContext") {
        toast.error("Camera requires HTTPS. Please access this app via a secure URL.", { duration: 7000 });
      } else if (error.name === "NotAllowedError" || error.name === "NotPermittedError") {
        setCameraHelpOpen(true);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        toast.error(
          isIOS
            ? "Camera blocked. On iPhone: Settings → Safari → Camera → Allow."
            : "Camera permission denied. Check browser settings.",
          { duration: 7000 }
        );
      } else if (error.name === "NotFoundError") {
        toast.error("No camera found on this device.", { duration: 5000 });
      } else {
        toast.error(`Camera error: ${error.message}`, { duration: 5000 });
      }
      // Still open dialog without camera — user can retry via photo slots
    }

    // Now open dialog and set camera state
    setDialogOpen(true);
    if (cameraStream) {
      setStream(cameraStream);
      setActiveCamera("selfie");
      setLastCameraMode("selfie");
      attachStreamToVideo(cameraStream);
    }

    // Fetch location in parallel (non-blocking)
    setLocationFetching(true);
    requestLocation()
      .then((loc) => {
        setCapturedLocation(loc);
        if (!worksiteZone) {
          calibrateFromLocation(loc, "Work site");
        }
      })
      .catch(() => {})
      .finally(() => setLocationFetching(false));
  };

  /** Retake a photo — clears the existing one and starts camera for that slot */
  const handleRetake = (slot: "selfie" | "environment") => {
    setPhotos((prev) => ({ ...prev, [slot]: null }));
    startCamera(slot);
  };

  const handleSubmit = async () => {
    if (!photos.selfie || !photos.environment) {
      toast.error(t("hub.capturePhotos"));
      return;
    }

    const insideGeofence =
      capturedLocation && worksiteZone ? isInsideGeofence(capturedLocation, worksiteZone) : null;

    await addEntry({
      type: dialogMode === "in" ? "clock_in" : "clock_out",
      timestamp: new Date(),
      location: capturedLocation,
      selfieUrl: photos.selfie,
      environmentUrl: photos.environment,
      insideGeofence,
    });

    if (dialogMode === "in") {
      toast.success(
        insideGeofence === false ? t("hub.clockedInOutside") : t("hub.clockedInSuccess"),
        { duration: 3000 }
      );
    } else {
      toast.success(t("hub.clockedOutSuccess"));
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
              <span className="text-sm font-medium">{t("hub.onDuty")} • {elapsed}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{t("hub.offDuty")}</span>
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
            <span className="text-xs font-bold">{t("hub.clockIn")}</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenDialog("out")}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-1.5 ring-4 ring-rose-600/20"
          >
            <LogOut className="w-7 h-7" />
            <span className="text-xs font-bold">{t("hub.clockOut")}</span>
          </button>
        )}
      </div>

      {/* Today's schedule */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Clock className="w-4 h-4" /> {t("hub.todaySchedule")}
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">{t("hub.start")}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">06:30</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">{t("hub.end")}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">17:00</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] text-muted-foreground mb-1">{t("hub.worked")}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">
              {isClockedIn ? formatElapsed(todayWorkedMs) : "0h"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 text-emerald-700 dark:text-emerald-500">{t("hub.quickActions")}</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors active:scale-95">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium text-center">{t("hub.nav.schedule")}</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors active:scale-95">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium text-center">{t("hub.nav.contract")}</span>
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
            <span className="text-[10px] font-medium text-center">{t("hub.myLocation")}</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Activity className="w-4 h-4" /> {t("hub.todayActivity")}
        </h3>
        {todayEntries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">{t("hub.noEntries")}</p>
            <p className="text-[10px] mt-0.5 opacity-60">{t("hub.clockInToStart")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} t={t} />
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
              {dialogMode === "in" ? t("hub.clockInTitle") : t("hub.clockOutTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {t("hub.photoInstructions")}
            </p>

            {/* Location status in dialog */}
            {locationFetching ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3 animate-pulse">
                <Navigation className="w-4 h-4 animate-spin" />
                <span>{t("hub.acquiringGps")}</span>
              </div>
            ) : (
              <LocationBadge location={capturedLocation} zones={worksiteZones} t={t} />
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
                  {activeCamera === "selfie" ? `📸 ${t("hub.selfie")}` : `🏞️ ${t("hub.environment")}`}
                </div>
              </div>
            )}

            {/* Photo slots with retake capability */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => photos.selfie ? undefined : startCamera("selfie")}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-emerald-600/30 hover:border-emerald-600/60 active:border-emerald-600 transition-colors overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/10 min-h-[100px]"
              >
                {photos.selfie ? (
                  <>
                    <img src={photos.selfie} alt="Selfie" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRetake("selfie"); }}
                      className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 active:scale-95 transition-all"
                      title="Retake"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Camera className="w-8 h-8 mx-auto text-emerald-600/40 mb-1" />
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500">{t("hub.selfie")}</p>
                  </div>
                )}
              </button>

              <button
                onClick={() => photos.environment ? undefined : startCamera("environment")}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-emerald-600/30 hover:border-emerald-600/60 active:border-emerald-600 transition-colors overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/10 min-h-[100px]"
              >
                {photos.environment ? (
                  <>
                    <img src={photos.environment} alt="Environment" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRetake("environment"); }}
                      className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 active:scale-95 transition-all"
                      title="Retake"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Image className="w-8 h-8 mx-auto text-emerald-600/40 mb-1" />
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500">{t("hub.environment")}</p>
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
              {t("hub.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!photos.selfie || !photos.environment}
              className={`h-12 sm:h-10 rounded-xl ${dialogMode === "in" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            >
              {dialogMode === "in" ? t("hub.confirmClockIn") : t("hub.confirmClockOut")}
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
