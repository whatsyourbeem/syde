import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FILE_SIZE_LIMIT } from "@/lib/image-compression";
import { fetchPublicResource, RemoteFetchError } from "@/lib/safe-remote-fetch";

// SVG is excluded: it can carry scripts, and the upload pipeline converts to WebP anyway.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]);

/**
 * Proxies an external image so the editor can re-upload it to our storage.
 * Used for pasted images whose original URLs expire (Notion, Google Docs, signed S3 links),
 * which browsers can't fetch directly because of CORS.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Only writers need this; keeping it behind auth stops it from being an open image proxy.
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const { body, contentType } = await fetchPublicResource(url, { maxBytes: FILE_SIZE_LIMIT, timeoutMs: 10_000 });
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Not a supported image" }, { status: 415 });
    }
    return new NextResponse(Buffer.from(body), {
      headers: {
        "content-type": contentType,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof RemoteFetchError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status });
  }
}
