/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0B1120',
          surface: '#111827',
          muted: '#1F2937',
          'muted-text': '#6B7280',
          foreground: '#F9FAFB',
        },
        primary: '#14B8A6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        'credential-education': '#7C3AED',
        'credential-income': '#14B8A6',
        'credential-identity': '#F59E0B',
      },
    },
  },
  plugins: [],
};
