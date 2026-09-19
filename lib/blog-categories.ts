export const BLOG_CATEGORIES = [
  { code: "story", label: "해프닝·회고" },
  { code: "launch", label: "프로젝트 소개" },
  { code: "tech", label: "기술" },
  { code: "growth", label: "마케팅·그로스" },
  { code: "til", label: "TIL" },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["code"];

export const MAX_BLOG_TAGS = 5;
export const MAX_BLOG_TAG_LENGTH = 20;

export function getCategoryLabel(code: string | null | undefined): string | null {
  return BLOG_CATEGORIES.find((category) => category.code === code)?.label ?? null;
}

/** Returns the code when it is one of the known categories, otherwise null (uncategorized). */
export function normalizeCategory(value: unknown): BlogCategory | null {
  return BLOG_CATEGORIES.find((category) => category.code === value)?.code ?? null;
}

/** Trims, lowercases, drops empties and duplicates, then caps length and count. Shared by the form and the server. */
export function normalizeTags(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const tag = value.trim().replace(/^#+/, "").trim().toLowerCase().slice(0, MAX_BLOG_TAG_LENGTH).trim();
    if (tag) seen.add(tag);
    if (seen.size >= MAX_BLOG_TAGS) break;
  }
  return [...seen];
}
