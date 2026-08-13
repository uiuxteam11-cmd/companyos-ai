const blockedHostnames = new Set(["localhost", "metadata.google.internal", "metadata", "0.0.0.0"]);

function isPrivateIpv4(hostname: string) {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const [a, b] = match.slice(1).map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function validateExternalUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("A valid absolute URL is required."); }
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are allowed.");
  if (url.username || url.password) throw new Error("URLs with embedded credentials are not allowed.");
  const hostname = url.hostname.toLowerCase();
  if (blockedHostnames.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal") || isPrivateIpv4(hostname) || hostname === "::1") {
    throw new Error("The URL host is not allowed.");
  }
  return url;
}
