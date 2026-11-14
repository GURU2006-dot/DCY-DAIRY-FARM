/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: 'var(--green)', dark: 'var(--dark)', light: 'var(--light-green)',
          cream: 'var(--cream)', gold: 'var(--gold)', text: 'var(--text)', muted: 'var(--muted)',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Arial', 'sans-serif'],
      },
      boxShadow: { soft: '0 12px 36px rgba(23, 60, 41, .08)' },
    },
  },
  plugins: [],
};
