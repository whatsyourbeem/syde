// Intl.Segmenter exists in every runtime we ship to (Node 16+, current browsers). The fallback only
// guards against an older environment: it still never splits a surrogate pair, just not combined emoji.
const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/**
 * Cuts `text` to at most `max` UTF-16 code units without splitting a character.
 *
 * `text.slice(0, max)` counts code units, so when the cut lands inside an emoji (a surrogate pair such as
 * "🍕") it leaves a lone surrogate behind. That is invalid Unicode: Search Console reports it as a
 * "truncated Unicode character" in structured data, and it can break meta descriptions and DB writes.
 * Here the cut moves back to the nearest character boundary instead, so combined emoji (👨‍👩‍👧, flags)
 * stay whole too. Text that already fits is returned untouched, and text without emoji is cut at the same
 * position `slice` would use.
 *
 * Callers append their own ellipsis.
 */
export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;

  const segments = graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
    : Array.from(text); // code points

  let result = "";
  for (const segment of segments) {
    if (result.length + segment.length > max) break;
    result += segment;
  }
  return result;
}
