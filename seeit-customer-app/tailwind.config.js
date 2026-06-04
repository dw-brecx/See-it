/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
        terracotta: {
          DEFAULT: '#E85D3A',
          50: '#FDF2EE',
          100: '#FBE0D6',
          200: '#F6C0AC',
          300: '#F1A083',
          400: '#ED8059',
          500: '#E85D3A',
          600: '#C9461F',
          700: '#9B3618',
          800: '#6D2611',
          900: '#3F160A',
        },
        // Surfaces / text
        bg: '#FAFAF7',
        ink: '#1A1A1A',
        muted: '#6B7280',
        line: '#E5E5E0',
        // Signals
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        verified: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'system-ui'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        sheet: '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        lift: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
