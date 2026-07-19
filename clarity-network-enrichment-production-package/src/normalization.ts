const LEGAL_SUFFIXES = new Set(["llc", "inc", "incorporated", "corp", "corporation", "ltd", "limited", "pllc", "lp", "llp"]);

export function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeName(value: string | null | undefined): string {
  if (!value) return "";
  const tokens = stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

export function normalizePhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

export function normalizeWebsite(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const u = new URL(value.includes("://") ? value : `https://${value}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizePostal(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

export function normalizeAddress(value: { street?: string | null; city?: string | null; state?: string | null; postalCode?: string | null } | null | undefined): string {
  if (!value) return "";
  return [value.street, value.city, value.state, normalizePostal(value.postalCode)]
    .map(v => normalizeName(v ?? ""))
    .filter(Boolean)
    .join("|");
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
}
