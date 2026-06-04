/** Tiny class-name joiner — keeps deps small in RN. */
export function cn(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(' ');
}
