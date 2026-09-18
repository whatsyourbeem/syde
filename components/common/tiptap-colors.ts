export interface SwatchColor {
  label: string;
  value: string;
}

// A fixed, small palette reads more like a style than a full picker would, and keeps published
// posts visually consistent with each other rather than each becoming a different color experiment.
export const HIGHLIGHT_COLORS: SwatchColor[] = [
  { label: "노랑", value: "#fef08a" },
  { label: "초록", value: "#bbf7d0" },
  { label: "파랑", value: "#bfdbfe" },
  { label: "분홍", value: "#fbcfe8" },
];

export const TEXT_COLORS: SwatchColor[] = [
  { label: "빨강", value: "#dc2626" },
  { label: "주황", value: "#ea580c" },
  { label: "초록", value: "#16a34a" },
  { label: "파랑", value: "#2563eb" },
  { label: "보라", value: "#9333ea" },
  { label: "회색", value: "#6b7280" },
];
