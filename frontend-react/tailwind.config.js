/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          light: '#ffedd5',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      ringColor: {
        primary: '#f97316',
      },
      boxShadow: {
        'focus': '0 0 0 3px rgba(249, 115, 22, 0.3)',
      },
    },
  },
  plugins: [],
} 