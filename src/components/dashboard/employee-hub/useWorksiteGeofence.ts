import { useCallback, useMemo, useState } from "react";
import type { GeoLocation, GeofenceZone } from "./useGeolocation";

const STORAGE_KEY = "employee_hub_worksite_zone_v1";

function isValidZone(v: unknown): v is GeofenceZone {
  if (!v || typeof v !== "object") return false;
  const z = v as Record<string, unknown>;
  return (
    typeof z.name === "string" &&
    typeof z.latitude === "number" &&
    typeof z.longitude === "number" &&
    typeof z.radiusMeters === "number" &&
    Number.isFinite(z.latitude) &&
    Number.isFinite(z.longitude) &&
    Number.isFinite(z.radiusMeters)
  );
}

function loadZone(): GeofenceZone | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidZone(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveZone(zone: GeofenceZone) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zone));
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

export function useWorksiteGeofence(defaultRadiusMeters = 250) {
  const [zone, setZone] = useState<GeofenceZone | null>(() => loadZone());

  const calibrateFromLocation = useCallback(
    (loc: GeoLocation, name = "Work site") => {
      const next: GeofenceZone = {
        name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radiusMeters: defaultRadiusMeters,
      };
      saveZone(next);
      setZone(next);
      return next;
    },
    [defaultRadiusMeters]
  );

  const clearZone = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setZone(null);
  }, []);

  const zones = useMemo(() => (zone ? [zone] : []), [zone]);

  return { zone, zones, calibrateFromLocation, clearZone };
}
