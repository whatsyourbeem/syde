import type { Transaction } from "@tiptap/pm/state";

const EXPIRING_HOSTS = [
  /(^|\.)notion\.so$/i, // file.notion.so, www.notion.so/image/... (needs a Notion session)
  /^prod-files-secure\.s3\.[a-z0-9-]+\.amazonaws\.com$/i, // Notion attachments
  /(^|\.)notion-static\.com$/i,
  /^lh\d*(-rt)?\.googleusercontent\.com$/i, // Google Docs/Slides pasted images
];

// Expiry parameters of S3, GCS, Azure SAS and CloudFront-style signed URLs.
const EXPIRY_QUERY_KEYS = ["x-amz-expires", "x-goog-expires", "expires", "se"];

/**
 * Pasted images that will stop loading after publish: Notion/Google Docs file URLs and signed, time-limited links.
 * Ordinary public image URLs are left alone so we don't copy (and pay egress for) every hotlinked image.
 */
export function isExpiringImageUrl(src: string, ownStoragePrefix: string | null): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (ownStoragePrefix && src.startsWith(ownStoragePrefix)) return false;
  if (EXPIRING_HOSTS.some((re) => re.test(url.hostname))) return true;
  if (url.hostname.endsWith("googleusercontent.com") && url.pathname.includes("/docsz/")) return true;
  const keys = new Set(Array.from(url.searchParams.keys(), (k) => k.toLowerCase()));
  return EXPIRY_QUERY_KEYS.some((key) => keys.has(key));
}

/** Image srcs inserted by a paste/drop transaction (only the changed ranges, not the whole document). */
export function pastedImageSrcs(tr: Transaction): string[] {
  const isPaste = tr.getMeta("paste") || tr.getMeta("uiEvent") === "paste" || tr.getMeta("uiEvent") === "drop";
  if (!isPaste || !tr.docChanged) return [];
  const srcs = new Set<string>();
  tr.steps.forEach((step, index) => {
    const rest = tr.mapping.slice(index + 1);
    step.getMap().forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      const from = rest.map(newStart, -1);
      const to = Math.min(rest.map(newEnd, 1), tr.doc.content.size);
      if (from >= to) return;
      tr.doc.nodesBetween(from, to, (node) => {
        if (node.type.name === "imageResize" && typeof node.attrs.src === "string") srcs.add(node.attrs.src);
      });
    });
  });
  return [...srcs];
}
