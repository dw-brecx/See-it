export function pluralize(count: number, singular: string, plural?: string): string {
  const p = plural ?? singular + 's';
  return `${count} ${count === 1 ? singular : p}`;
}
