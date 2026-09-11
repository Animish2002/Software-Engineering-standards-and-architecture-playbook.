# Formatting helpers

```ts
// lib/format.ts
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(digits)} ${UNITS[i]}`;
}

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d));

export function formatRelative(d: Date | string, now = Date.now()): string {
  const seconds = (new Date(d).getTime() - now) / 1000;
  const abs = Math.abs(seconds);
  // [unit, seconds per unit, use this unit while abs < threshold]
  const steps: [Intl.RelativeTimeFormatUnit, number, number][] = [
    ['second', 1, 60],
    ['minute', 60, 3600],
    ['hour', 3600, 86_400],
    ['day', 86_400, 604_800],
    ['week', 604_800, 2_629_800],
    ['month', 2_629_800, 31_557_600],
  ];
  for (const [unit, perUnit, threshold] of steps) if (abs < threshold) return rtf.format(Math.round(seconds / perUnit), unit);
  return rtf.format(Math.round(seconds / 31_557_600), 'year');
}

export const formatNumber = (n: number) => new Intl.NumberFormat().format(n);
export const formatPercent = (ratio: number, digits = 0) => new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: digits }).format(ratio);
export const formatMoney = (minorUnits: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(minorUnits / 100);

export const truncateMiddle = (s: string, max = 40) => (s.length <= max ? s : `${s.slice(0, Math.ceil(max / 2) - 1)}…${s.slice(-Math.floor(max / 2))}`);
```

Create `Intl` formatters once at module level (they're expensive to
construct). Use the user's locale by passing `undefined`.
