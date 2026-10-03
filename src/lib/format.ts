/** 34700 -> "34.7K", 1250000 -> "1.3M" */
export function compactNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** 12345 -> "12,345" */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
