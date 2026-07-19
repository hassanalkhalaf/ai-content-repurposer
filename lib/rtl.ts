/**
 * Detects whether a string is predominantly right-to-left (Arabic, Hebrew,
 * Persian, Urdu, etc.) so the UI can flip text direction and alignment
 * automatically for generated content in those languages.
 */
const RTL_CHAR_RANGE =
  /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;

export function isRTLText(text: string): boolean {
  if (!text) return false;

  const rtlMatches = text.match(new RegExp(RTL_CHAR_RANGE, "g")) || [];
  const latinMatches = text.match(/[A-Za-z]/g) || [];

  if (rtlMatches.length === 0) return false;
  return rtlMatches.length >= latinMatches.length;
}

export function directionClass(text: string): { dir: "rtl" | "ltr"; className: string } {
  return isRTLText(text)
    ? { dir: "rtl", className: "text-right" }
    : { dir: "ltr", className: "text-left" };
}