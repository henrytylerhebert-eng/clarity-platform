export interface UrlSafetyPolicy {
  allowedDomainSuffixes?: string[];
  allowHttp?: boolean;
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some(x => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0;
}

function isUnsafeHostname(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, "");
  return normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local") || normalized.endsWith(".internal") || isPrivateIpv4(normalized) || normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd");
}

export function validateOutboundUrl(value: string, policy: UrlSafetyPolicy = {}): string[] {
  const errors: string[] = [];
  let url: URL;
  try { url = new URL(value); } catch { return ["URL is invalid."]; }
  if (!policy.allowHttp && url.protocol !== "https:") errors.push("Only HTTPS URLs are allowed.");
  if (policy.allowHttp && !["https:", "http:"].includes(url.protocol)) errors.push("Only HTTP(S) URLs are allowed.");
  if (url.username || url.password) errors.push("URLs containing credentials are prohibited.");
  if (isUnsafeHostname(url.hostname)) errors.push("Private, loopback, link-local, or internal hosts are prohibited.");
  if (policy.allowedDomainSuffixes?.length) {
    const host = url.hostname.toLowerCase();
    const allowed = policy.allowedDomainSuffixes.some(suffix => host === suffix.toLowerCase() || host.endsWith(`.${suffix.toLowerCase()}`));
    if (!allowed) errors.push("Domain is not allowlisted.");
  }
  return errors;
}
