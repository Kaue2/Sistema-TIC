export function initialsFrom(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  const first = words[0][0] ?? "";
  const second = words.length > 1 ? words[1][0] ?? "" : words[0][1] ?? "";
  return `${first}${second}`.toUpperCase() || "??";
}
