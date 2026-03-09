import { useState, useCallback } from "react";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface GeofenceZone {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// Haversine distance in meters
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideGeofence(loc: GeoLocation, zone: GeofenceZone): boolean {
  return haversineDistance(loc.latitude, loc.longitude, zone.latitude, zone.longitude) <= zone.radiusMeters;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<GeoLocation> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Geolocation is not supported by this device.";
        setError(err);
        setLoading(false);
        reject(new Error(err));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geo: GeoLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setLocation(geo);
          setLoading(false);
          resolve(geo);
        },
        (err) => {
          const msg =
            err.code === 1
              ? "Location permission denied. Please allow location access."
              : err.code === 2
              ? "Location unavailable. Please try again."
              : "Location request timed out.";
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  return { location, loading, error, requestLocation };
}
