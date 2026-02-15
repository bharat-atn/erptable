// Country-specific postcode format patterns for instant client-side validation
export const postcodePatterns: Record<string, { regex: RegExp; example: string; label: string }> = {
  "Sweden": { regex: /^\d{3}\s?\d{2}$/, example: "123 45", label: "5 digits (XXX XX)" },
  "Norway": { regex: /^\d{4}$/, example: "0123", label: "4 digits" },
  "Denmark": { regex: /^\d{4}$/, example: "1234", label: "4 digits" },
  "Finland": { regex: /^\d{5}$/, example: "00100", label: "5 digits" },
  "Germany": { regex: /^\d{5}$/, example: "10115", label: "5 digits" },
  "France": { regex: /^\d{5}$/, example: "75001", label: "5 digits" },
  "Italy": { regex: /^\d{5}$/, example: "00100", label: "5 digits" },
  "Spain": { regex: /^\d{5}$/, example: "28001", label: "5 digits" },
  "Portugal": { regex: /^\d{4}(-\d{3})?$/, example: "1000-001", label: "XXXX or XXXX-XXX" },
  "Netherlands": { regex: /^\d{4}\s?[A-Za-z]{2}$/, example: "1234 AB", label: "XXXX AA" },
  "Belgium": { regex: /^\d{4}$/, example: "1000", label: "4 digits" },
  "Austria": { regex: /^\d{4}$/, example: "1010", label: "4 digits" },
  "Switzerland": { regex: /^\d{4}$/, example: "8001", label: "4 digits" },
  "United Kingdom": { regex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: "SW1A 1AA", label: "UK format (e.g. SW1A 1AA)" },
  "Ireland": { regex: /^[A-Za-z]\d{2}\s?[A-Za-z\d]{4}$/, example: "D02 AF30", label: "Eircode (e.g. D02 AF30)" },
  "United States": { regex: /^\d{5}(-\d{4})?$/, example: "10001", label: "5 digits or ZIP+4" },
  "Canada": { regex: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, example: "K1A 0B1", label: "A1A 1A1" },
  "Australia": { regex: /^\d{4}$/, example: "2000", label: "4 digits" },
  "New Zealand": { regex: /^\d{4}$/, example: "6011", label: "4 digits" },
  "Japan": { regex: /^\d{3}-?\d{4}$/, example: "100-0001", label: "XXX-XXXX" },
  "South Korea": { regex: /^\d{5}$/, example: "03171", label: "5 digits" },
  "India": { regex: /^\d{6}$/, example: "110001", label: "6 digits" },
  "Brazil": { regex: /^\d{5}-?\d{3}$/, example: "01310-100", label: "XXXXX-XXX" },
  "Mexico": { regex: /^\d{5}$/, example: "06600", label: "5 digits" },
  "Poland": { regex: /^\d{2}-\d{3}$/, example: "00-001", label: "XX-XXX" },
  "Czech Republic": { regex: /^\d{3}\s?\d{2}$/, example: "110 00", label: "XXX XX" },
  "Romania": { regex: /^\d{6}$/, example: "010011", label: "6 digits" },
  "Hungary": { regex: /^\d{4}$/, example: "1011", label: "4 digits" },
  "Thailand": { regex: /^\d{5}$/, example: "10100", label: "5 digits" },
  "Singapore": { regex: /^\d{6}$/, example: "018956", label: "6 digits" },
  "China": { regex: /^\d{6}$/, example: "100000", label: "6 digits" },
  "Russia": { regex: /^\d{6}$/, example: "101000", label: "6 digits" },
  "Turkey": { regex: /^\d{5}$/, example: "34000", label: "5 digits" },
  "South Africa": { regex: /^\d{4}$/, example: "2000", label: "4 digits" },
  "Argentina": { regex: /^[A-Za-z]\d{4}[A-Za-z]{3}$/, example: "C1420ABC", label: "XNNNNXXX" },
  "Colombia": { regex: /^\d{6}$/, example: "110111", label: "6 digits" },
  "Greece": { regex: /^\d{3}\s?\d{2}$/, example: "105 57", label: "XXX XX" },
  "Croatia": { regex: /^\d{5}$/, example: "10000", label: "5 digits" },
  "Bulgaria": { regex: /^\d{4}$/, example: "1000", label: "4 digits" },
  "Slovakia": { regex: /^\d{3}\s?\d{2}$/, example: "811 01", label: "XXX XX" },
  "Slovenia": { regex: /^\d{4}$/, example: "1000", label: "4 digits" },
  "Latvia": { regex: /^LV-\d{4}$/, example: "LV-1001", label: "LV-XXXX" },
  "Lithuania": { regex: /^LT-\d{5}$/, example: "LT-01001", label: "LT-XXXXX" },
  "Estonia": { regex: /^\d{5}$/, example: "10111", label: "5 digits" },
  "Israel": { regex: /^\d{7}$/, example: "6100000", label: "7 digits" },
  "Philippines": { regex: /^\d{4}$/, example: "1000", label: "4 digits" },
  "Malaysia": { regex: /^\d{5}$/, example: "50000", label: "5 digits" },
  "Pakistan": { regex: /^\d{5}$/, example: "44000", label: "5 digits" },
  "Nigeria": { regex: /^\d{6}$/, example: "100001", label: "6 digits" },
  "Egypt": { regex: /^\d{5}$/, example: "11511", label: "5 digits" },
};

export function validatePostcodeFormat(country: string, postcode: string): { valid: boolean; message: string } | null {
  const pattern = postcodePatterns[country];
  if (!pattern || !postcode) return null;
  
  if (pattern.regex.test(postcode.trim())) {
    return { valid: true, message: `Valid ${country} postcode format` };
  }
  return { valid: false, message: `Invalid format for ${country}. Expected: ${pattern.label} (e.g. ${pattern.example})` };
}
