import { COLOR_PALETTE } from "./constants";

export function pickMemberColor(usedColors: string[]) {
  const available = COLOR_PALETTE.find((color) => !usedColors.includes(color));
  return available || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}
