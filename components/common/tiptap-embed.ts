import type { Schema, Node as PMNode } from "@tiptap/pm/model";
import { upgradeToHttps } from "@/lib/utils";
import { extractYoutubeId } from "./tiptap-youtube";

/** `text` as an http(s) URL (upgraded to https), or null if it isn't a single web address. */
export function toHttpUrl(text: string): string | null {
  if (/\s/.test(text)) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return upgradeToHttps(text) || text;
  } catch {
    return null;
  }
}

/** Like toHttpUrl, but also accepts an address typed without a scheme ("youtu.be/abc"). */
export function toHttpUrlLenient(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return toHttpUrl(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

/** A YouTube node for a YouTube URL (normalized to a canonical watch URL), or null for any other URL. */
export function youtubeNode(schema: Schema, url: string): PMNode | null {
  const id = extractYoutubeId(url);
  return id ? schema.nodes.youtube.create({ src: `https://www.youtube.com/watch?v=${id}` }) : null;
}

/** A link preview card for `url`. */
export function linkPreviewNode(schema: Schema, url: string): PMNode {
  return schema.nodes.linkPreview.create({ src: url });
}
