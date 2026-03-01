/**
 * Shared profile utilities: phone parsing, date formatting, country ordering.
 * Used by both LoginProfileDialog and Sidebar UserProfileDialog.
 */
import { countries } from "@/lib/countries";
import { format, parse } from "date-fns";

// ─── ISO date format ─────────────────────────────────────────────
const ISO_STORAGE_KEY = "iso-standards-settings";

/** Read the configured ISO date display format (e.g. "YYYY-MM-DD", "DD/MM/YYYY") */
export function getIsoDateFormat(): string {
  try {
    const saved = localStorage.getItem(ISO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.date_format || "YYYY-MM-DD";
    }
  } catch {}
  return "YYYY-MM-DD";
}

/** Convert our ISO token format to date-fns pattern */
function toDateFnsPattern(isoFmt: string): string {
  return isoFmt
    .replace("YYYY", "yyyy")
    .replace("YY", "yy")
    .replace("DD", "dd");
}

/** Format a canonical DB date (yyyy-MM-dd) into the display format */
export function formatDateForDisplay(dbDate: string, isoFmt?: string): string {
  if (!dbDate) return "";
  const fmt = isoFmt ?? getIsoDateFormat();
  try {
    const d = parse(dbDate, "yyyy-MM-dd", new Date());
    return format(d, toDateFnsPattern(fmt));
  } catch {
    return dbDate;
  }
}

/** Parse a display-formatted date string back to canonical yyyy-MM-dd */
export function parseDateToCanonical(displayDate: string, isoFmt?: string): string {
  if (!displayDate) return "";
  const fmt = isoFmt ?? getIsoDateFormat();
  try {
    const d = parse(displayDate, toDateFnsPattern(fmt), new Date());
    return format(d, "yyyy-MM-dd");
  } catch {
    // If it's already canonical, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) return displayDate;
    return displayDate;
  }
}

// ─── Phone helpers ───────────────────────────────────────────────
const PRIORITY_DIAL_CODES = ["+46", "+40", "+66", "+380"];

export function getOrderedCountries() {
  const priority = countries.filter((c) => PRIORITY_DIAL_CODES.includes(c.dialCode));
  priority.sort((a, b) => PRIORITY_DIAL_CODES.indexOf(a.dialCode) - PRIORITY_DIAL_CODES.indexOf(b.dialCode));
  const rest = countries.filter((c) => !PRIORITY_DIAL_CODES.includes(c.dialCode));
  return { priority, rest };
}

export function parsePhone(stored: string): { dialCode: string; localNumber: string } {
  if (!stored) return { dialCode: "+46", localNumber: "" };
  const sorted = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (stored.startsWith(c.dialCode)) {
      return { dialCode: c.dialCode, localNumber: stored.slice(c.dialCode.length).trim() };
    }
  }
  return { dialCode: "+46", localNumber: stored };
}

export function combinePhone(dialCode: string, localNumber: string): string | null {
  return localNumber ? `${dialCode}${localNumber}` : null;
}

// ─── Language → nationality/dialCode mapping ─────────────────────
export const LANG_DEFAULTS: Record<string, { nationality: string; dialCode: string }> = {
  sv: { nationality: "Swedish", dialCode: "+46" },
  ro: { nationality: "Romanian", dialCode: "+40" },
};
export const AUTO_SET_NATIONALITIES = Object.values(LANG_DEFAULTS).map((v) => v.nationality);

// ─── Profile completeness guard ─────────────────────────────────
/** Returns true when all required identity fields are present (non-empty). */
export function isProfileIdentityComplete(data: {
  dateOfBirth: string;
  localNumber: string;
  nationality: string;
}): boolean {
  return !!(
    data.dateOfBirth?.trim() &&
    data.localNumber?.replace(/[\s\-]/g, "").length >= 1 &&
    data.nationality?.trim()
  );
}
