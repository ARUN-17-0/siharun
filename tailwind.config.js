/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mesh: {
          dark: '#0b0f19',
          card: '#111827',
          border: 'rgba(51, 65, 85, 0.4)',
          accent: '#38bdf8',
          accentGlow: 'rgba(56, 189, 248, 0.15)',
          alert: '#f43f5e',
          warning: '#f59e0b',
          success: '#10b981',
          gold: '#eab308',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}

