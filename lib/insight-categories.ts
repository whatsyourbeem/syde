export const INSIGHT_CATEGORIES = [
  { code: "story", label: "해프닝·회고" },
  { code: "launch", label: "프로젝트 소개" },
  { code: "tech", label: "기술" },
  { code: "growth", label: "마케팅·그로스" },
  { code: "til", label: "TIL" },
] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]["code"];

export const MAX_INSIGHT_TAGS = 5;
export const MAX_INSIGHT_TAG_LENGTH = 20;

export function getCategoryLabel(code: string | null | undefined): string | null {
  return INSIGHT_CATEGORIES.find((category) => category.code === code)?.label ?? null;
}

/** Returns the code when it is one of the known categories, otherwise null (uncategorized). */
export function normalizeCategory(value: unknown): InsightCategory | null {
  return INSIGHT_CATEGORIES.find((category) => category.code === value)?.code ?? null;
}

/** Trims, lowercases, drops empties and duplicates, then caps length and count. Shared by the form and the server. */
export function normalizeTags(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const tag = value.trim().replace(/^#+/, "").trim().toLowerCase().slice(0, MAX_INSIGHT_TAG_LENGTH);
    if (tag) seen.add(tag);
    if (seen.size >= MAX_INSIGHT_TAGS) break;
  }
  return [...seen];
}
