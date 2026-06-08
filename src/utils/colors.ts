const CANVAS_COLORS = [
  "#E63946", "#2A9D8F", "#E9C46A", "#F4A261",
  "#A8DADC", "#457B9D", "#8338EC", "#FB5607",
  "#06D6A0", "#FFD166", "#EF476F", "#118AB2",
];

export function getObjectColor(index: number): string {
  return CANVAS_COLORS[index % CANVAS_COLORS.length];
}
