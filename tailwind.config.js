/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070a',
          900: '#0a0e14',
          800: '#12171f',
          700: '#1b222c',
          600: '#2a3340',
        },
        signal: {
          500: '#e2452c',
          400: '#f0603f',
        },
        ember: '#f2b544',
        moss: '#4c9a6b',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
