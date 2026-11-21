/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1322',
          900: '#101827', // Base canvas
          800: '#172338', // Card container
          700: '#202F45', // Elevated surface
          600: '#25364D', // Structural border
        },
        pearl: {
          50: '#FFFFFF',
          100: '#F7F5F0', // Primary text
          200: '#EEECE5', // Dim secondary
          300: '#E2E8F0',
        },
        coral: {
          50: '#FFF5F5',
          100: '#FFE4E0',
          400: '#FF7770',
          500: '#FF625E', // Primary Electric Coral
          600: '#E04D4B',
          700: '#C03836',
        },
        emerald: {
          500: '#29B887', // Financial Success / Inflow
        },
        brand: {
          50: '#FFE4E0',
          100: '#FFD0CB',
          500: '#FF625E',
          600: '#FF625E',
          700: '#E04D4B',
          900: '#101827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
