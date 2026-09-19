/** Search tab ids. "insights" is the pre-rename id for the blog tab and keeps working for old links. */
export function normalizeSearchTab(tab: string | null | undefined): string {
  if (!tab) return "all";
  return tab === "insights" ? "blog" : tab;
}
