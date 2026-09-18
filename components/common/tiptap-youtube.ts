/**
 * Extracts a YouTube video ID from watch/youtu.be/shorts/embed URLs, or null if `url` isn't YouTube.
 * The official extension's own paste-rule regex mis-parses "shorts" as the video ID, so pasted URLs
 * are normalized here first and handed to `setYoutubeVideo` as a canonical watch URL.
 */
export function extractYoutubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www|m|music)\./, "");
  if (host === "youtu.be") {
    return parsed.pathname.slice(1).split("/")[0] || null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "v") {
    return segments[1] || null;
  }
  if (segments[0] === "watch") {
    return parsed.searchParams.get("v");
  }
  return null;
}
