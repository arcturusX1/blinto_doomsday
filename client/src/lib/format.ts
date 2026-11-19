// 727 → "12h 7m", 45 → "45m", 120 → "2h"
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

// [6, 9, 20] → "6, 9 and 20"
export function formatList(items: (string | number)[]): string {
  return new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(items.map(String))
}
