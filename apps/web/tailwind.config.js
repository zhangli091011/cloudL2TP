/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        panel: {
          bg: 'var(--panel-bg)',
          card: 'var(--panel-card)',
          border: 'var(--panel-border)',
          text: 'var(--panel-text)',
          muted: 'var(--panel-muted)',
          accent: 'var(--panel-accent)',
          success: 'var(--panel-success)',
          warning: 'var(--panel-warning)',
          danger: 'var(--panel-danger)',
          info: 'var(--panel-info)',
        },
      },
    },
  },
  plugins: [],
}
