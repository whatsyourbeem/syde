// Shared between the client node view (tiptap-callout.tsx) and the server-only renderer
// (tiptap-server-extensions.ts) — no React import here, so it's safe for both.
export const CALLOUT_VARIANTS = ["info", "tip", "warning"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export function isCalloutVariant(value: unknown): value is CalloutVariant {
  return typeof value === "string" && (CALLOUT_VARIANTS as readonly string[]).includes(value);
}
