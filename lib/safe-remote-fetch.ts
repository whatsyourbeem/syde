// Server-only: relies on node:dns and must never be imported from client components.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class RemoteFetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3],
];

function isBlockedIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[1]);
  return (
    lower === "::" ||
    lower === "::1" ||
    /^f[cd]/.test(lower) || // fc00::/7 unique local
    /^fe[89ab]/.test(lower) || // fe80::/10 link-local
    /^ff/.test(lower) // multicast
  );
}

function isBlockedAddress(ip: string): boolean {
  return isIP(ip) === 6 ? isBlockedIPv6(ip) : isBlockedIPv4(ip);
}

/** Rejects non-http(s) URLs and hosts that resolve to private, loopback or link-local addresses. */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RemoteFetchError("Invalid URL", 400);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RemoteFetchError("Only http(s) URLs are allowed", 400);
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0) throw new RemoteFetchError("Host could not be resolved", 400);
  if (addresses.some(isBlockedAddress)) throw new RemoteFetchError("Host is not allowed", 403);
  return url;
}

/**
 * Fetches a public URL with SSRF guards: every redirect hop is re-validated, the body is capped at `maxBytes`,
 * and the whole request is bounded by `timeoutMs`.
 * Note: DNS is resolved separately from the request, so a rebinding host could still slip through between checks.
 */
export async function fetchPublicResource(
  raw: string,
  { maxBytes, timeoutMs, maxRedirects = 3 }: { maxBytes: number; timeoutMs: number; maxRedirects?: number },
): Promise<{ body: Uint8Array; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let current = raw;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const url = await assertPublicHttpUrl(current);
      const response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; SYDEImageFetcher/1.0)", accept: "image/*" },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new RemoteFetchError("Redirect without location", 502);
        current = new URL(location, url).toString();
        continue;
      }
      if (!response.ok || !response.body) throw new RemoteFetchError(`Upstream responded ${response.status}`, 502);

      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > maxBytes) throw new RemoteFetchError("File too large", 413);

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel();
          throw new RemoteFetchError("File too large", 413);
        }
        chunks.push(value);
      }
      const body = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { body, contentType: response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "" };
    }
    throw new RemoteFetchError("Too many redirects", 502);
  } catch (error) {
    if (error instanceof RemoteFetchError) throw error;
    if (controller.signal.aborted) throw new RemoteFetchError("Timed out", 504);
    throw new RemoteFetchError("Fetch failed", 502);
  } finally {
    clearTimeout(timer);
  }
}
