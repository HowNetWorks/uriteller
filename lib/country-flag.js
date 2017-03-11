export default function countryFlag(code) {
  // Turn two-letter ISO 3166-1 alpha-2 country codes to country flag emojis.
  // See https://en.wikipedia.org/wiki/Regional_Indicator_Symbol

  if (!code || code.length !== 2) {
    return "";
  }

  const up = code.toUpperCase();
  const a = up.charCodeAt(0) - 0x41;
  const b = up.charCodeAt(1) - 0x41;
  if (a < 0 || a >= 26 || b < 0 || b >= 26) {
    return "";
  }

  const base = 0x1f1e6;
  return String.fromCodePoint(base + a, base + b);
}
