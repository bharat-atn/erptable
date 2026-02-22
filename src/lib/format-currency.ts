/**
 * Currency / number formatting utility.
 *
 * Reads the ISO-standards settings stored in localStorage and formats
 * numbers accordingly.  Falls back to Swedish locale conventions:
 *   • Thousand separator: thin space (U+202F)
 *   • Decimal separator:  comma
 *   • Currency code appended after the amount
 *
 * Reference standard: ISO 80000-1 (Quantities and units)
 */

const ISO_STORAGE_KEY = "iso-standards-settings";

type NumberFormatPreset = "sv-SE" | "en-US" | "de-DE" | "fr-FR";

interface FormatSettings {
  thousandSep: string;
  decimalSep: string;
  currencyPosition: "suffix" | "prefix";
}

const PRESET_MAP: Record<NumberFormatPreset, FormatSettings> = {
  "sv-SE": { thousandSep: "\u202F", decimalSep: ",", currencyPosition: "suffix" },
  "en-US": { thousandSep: ",", decimalSep: ".", currencyPosition: "prefix" },
  "de-DE": { thousandSep: ".", decimalSep: ",", currencyPosition: "suffix" },
  "fr-FR": { thousandSep: "\u202F", decimalSep: ",", currencyPosition: "suffix" },
};

function getSettings(): FormatSettings {
  try {
    const raw = localStorage.getItem(ISO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const preset = parsed.number_format as NumberFormatPreset | undefined;
      if (preset && PRESET_MAP[preset]) return PRESET_MAP[preset];
    }
  } catch {
    // ignore
  }
  return PRESET_MAP["sv-SE"]; // default
}

/**
 * Format a number according to the configured locale.
 * @param value  – the numeric value
 * @param decimals – number of decimal places (default 0)
 */
export function formatNumber(value: number, decimals = 0): string {
  const { thousandSep, decimalSep } = getSettings();
  const fixed = value.toFixed(decimals);
  const [intPart, fracPart] = fixed.split(".");

  // Add thousand separators
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  if (decimals > 0 && fracPart) {
    return `${withSep}${decimalSep}${fracPart}`;
  }
  return withSep;
}

/**
 * Format a currency amount.
 * @param value – the numeric value
 * @param currency – ISO 4217 currency code (default reads from settings, fallback SEK)
 * @param decimals – decimal places (default 2 for hourly, 0 for monthly)
 */
export function formatCurrency(value: number, currency?: string, decimals = 2): string {
  const settings = getSettings();

  let cur = currency;
  if (!cur) {
    try {
      const raw = localStorage.getItem(ISO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        cur = parsed.currency || "SEK";
      }
    } catch {
      // ignore
    }
    if (!cur) cur = "SEK";
  }

  const formatted = formatNumber(value, decimals);

  if (settings.currencyPosition === "prefix") {
    return `${cur} ${formatted}`;
  }
  return `${formatted} ${cur}`;
}
