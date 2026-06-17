/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        jefe: '#1A2E4A',
        naranja: '#FF6B2B',
        'naranja-light': '#FFF0E8',
        muted: '#6B7A8D',
        borde: '#E2E6EA',
        verde: '#22C55E',
        rojo: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
