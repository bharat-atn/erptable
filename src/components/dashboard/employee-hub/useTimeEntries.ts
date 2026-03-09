import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GeoLocation } from "./useGeolocation";

export interface TimeEntry {
  id: string;
  type: "clock_in" | "clock_out";
  timestamp: Date;
  location: GeoLocation | null;
  selfieUrl: string | null;
  environmentUrl: string | null;
  insideGeofence: boolean | null;
  projectId?: string | null;
}

interface NewEntryInput {
  type: "clock_in" | "clock_out";
  timestamp: Date;
  location: GeoLocation | null;
  selfieUrl: string | null;
  environmentUrl: string | null;
  insideGeofence: boolean | null;
  projectId?: string | null;
}

/** Upload a base64 data-url to the clock-photos bucket, return public URL */
async function uploadPhoto(dataUrl: string, prefix: string): Promise<string | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("clock-photos").upload(path, blob, { contentType: blob.type });
    if (error) {
      console.error("Photo upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("clock-photos").getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Photo upload failed:", err);
    return null;
  }
}

export function useTimeEntries(employeeId?: string | null, orgId?: string | null) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load today's entries from DB
  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    supabase
      .from("time_clock_entries")
      .select("*")
      .eq("org_id", orgId)
      .gte("recorded_at", `${today}T00:00:00`)
      .lte("recorded_at", `${today}T23:59:59`)
      .order("recorded_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load time entries:", error);
        } else if (data) {
          setEntries(
            data.map((row: any) => ({
              id: row.id,
              type: row.entry_type as "clock_in" | "clock_out",
              timestamp: new Date(row.recorded_at),
              location: row.latitude != null ? { latitude: Number(row.latitude), longitude: Number(row.longitude), accuracy: 0, timestamp: new Date(row.recorded_at).getTime() } : null,
              selfieUrl: row.selfie_url,
              environmentUrl: row.environment_photo_url,
              insideGeofence: row.inside_geofence,
              projectId: row.project_id,
            }))
          );
        }
        setLoading(false);
      });
  }, [orgId]);

  const addEntry = useCallback(
    async (entry: NewEntryInput) => {
      // Optimistic local update
      const tempId = crypto.randomUUID();
      const localEntry: TimeEntry = { ...entry, id: tempId };
      setEntries((prev) => [localEntry, ...prev]);

      // Upload photos in parallel
      const [selfiePublicUrl, envPublicUrl] = await Promise.all([
        entry.selfieUrl ? uploadPhoto(entry.selfieUrl, "selfies") : Promise.resolve(null),
        entry.environmentUrl ? uploadPhoto(entry.environmentUrl, "environment") : Promise.resolve(null),
      ]);

      if (!orgId) {
        console.warn("No org_id available for time entry persistence");
        return;
      }

      // Persist to database
      const insertData: any = {
        org_id: orgId,
        entry_type: entry.type,
        recorded_at: entry.timestamp.toISOString(),
        latitude: entry.location?.latitude ?? null,
        longitude: entry.location?.longitude ?? null,
        inside_geofence: entry.insideGeofence,
        selfie_url: selfiePublicUrl,
        environment_photo_url: envPublicUrl,
        project_id: entry.projectId ?? null,
      };

      if (employeeId) {
        insertData.employee_id = employeeId;
      }

      const { data, error } = await supabase
        .from("time_clock_entries")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error("Failed to persist time entry:", error);
      } else if (data) {
        // Replace temp id with real id
        setEntries((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, id: data.id, selfieUrl: selfiePublicUrl ?? e.selfieUrl, environmentUrl: envPublicUrl ?? e.environmentUrl } : e))
        );
      }
    },
    [employeeId, orgId]
  );

  const todayEntries = entries.filter(
    (e) => e.timestamp.toDateString() === new Date().toDateString()
  );

  const lastEntry = entries[0] ?? null;

  const isClockedIn = lastEntry?.type === "clock_in";

  const clockInTime = isClockedIn ? lastEntry.timestamp : null;

  const todayWorkedMs = todayEntries.reduce((acc, entry, i, arr) => {
    if (entry.type === "clock_in") {
      const matchingOut = arr
        .slice(0, i)
        .find((e) => e.type === "clock_out");
      if (matchingOut) {
        return acc + (matchingOut.timestamp.getTime() - entry.timestamp.getTime());
      }
      if (isClockedIn && entry.id === lastEntry?.id) {
        return acc + (Date.now() - entry.timestamp.getTime());
      }
    }
    return acc;
  }, 0);

  return { entries, todayEntries, addEntry, isClockedIn, clockInTime, todayWorkedMs, lastEntry, loading };
}
