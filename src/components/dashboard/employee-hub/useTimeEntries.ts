import { useState, useCallback } from "react";
import type { GeoLocation } from "./useGeolocation";

export interface TimeEntry {
  id: string;
  type: "clock_in" | "clock_out";
  timestamp: Date;
  location: GeoLocation | null;
  selfieUrl: string | null;
  environmentUrl: string | null;
  insideGeofence: boolean | null;
}

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  const addEntry = useCallback(
    (entry: Omit<TimeEntry, "id">) => {
      setEntries((prev) => [
        { ...entry, id: crypto.randomUUID() },
        ...prev,
      ]);
    },
    []
  );

  const todayEntries = entries.filter(
    (e) => e.timestamp.toDateString() === new Date().toDateString()
  );

  const lastEntry = entries[0] ?? null;

  const isClockedIn =
    lastEntry?.type === "clock_in";

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

  return { entries, todayEntries, addEntry, isClockedIn, clockInTime, todayWorkedMs, lastEntry };
}
