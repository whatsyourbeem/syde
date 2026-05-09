import { revalidateTag } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";

// Cast to the 1-arg runtime API. The TypeScript type in this Next.js version
// requires a cache-life profile (for "use cache" blocks), but unstable_cache
// invalidation works with tag alone at runtime.
const _revalidateTag = revalidateTag as (tag: string) => void;

export function revalidateTagSafe(tag: string): void {
  try {
    _revalidateTag(tag);
  } catch {
    console.error("Failed to revalidate tag:", tag);
  }
}

function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueShowcaseSlug(
  supabase: SupabaseClient,
  name: string
): Promise<string> {
  let slug = slugify(name) || "project";
  const { data: existing } = await supabase
    .from("showcases")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }
  return slug;
}
