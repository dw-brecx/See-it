/**
 * Single source of truth for color tokens. Use these everywhere instead of
 * hardcoded hex — both for consistency and so a future theme/dark mode pass
 * only has to touch one file.
 *
 * Contrast rules of thumb:
 *  - on bg (cream)        → text, textSecondary, ink-700ish
 *  - on surface (white)   → text, textSecondary
 *  - on primary           → white (always)
 *  - on verifiedBlue      → white
 */
export const colors = {
  // Surfaces
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3EE',

  // Text
  text: '#1A1A1A',
  textSecondary: '#64748B',
  textMuted: '#9CA3AF',

  // Brand
  primary: '#E85D3A',
  primaryDark: '#C9461F',
  primarySoft: '#FDF2EE',

  // Trust / signal
  verifiedBlue: '#3B82F6',
  verifiedSoft: '#EFF6FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Lines / borders
  border: '#E5E7EB',
  borderLight: '#F3F3EE',

  // Star ratings (terracotta, per the polish brief, not gold)
  starFilled: '#E85D3A',
  starEmpty: '#E5E7EB',
} as const;
