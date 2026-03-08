/**
 * Normalise user-typed numeric strings so both comma and period
 * are accepted as decimal separators (common in ES/EU locales).
 *
 * Returns a valid number or `fallback` when the input is empty / invalid.
 */
export const parseDecimal = (raw: string | number | undefined | null, fallback: number = 0): number => {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "number") return isNaN(raw) ? fallback : raw;
  // Replace comma with period, strip whitespace
  const normalised = String(raw).trim().replace(",", ".");
  const n = Number(normalised);
  return isNaN(n) ? fallback : n;
};

/**
 * Same as parseDecimal but returns `undefined` when input is empty,
 * useful for optional numeric fields.
 */
export const parseOptionalDecimal = (raw: string | number | undefined | null): number | undefined => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw === "number") return isNaN(raw) ? undefined : raw;
  const normalised = String(raw).trim().replace(",", ".");
  const n = Number(normalised);
  return isNaN(n) ? undefined : n;
};
