/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        'modal': '9999',
        'modal-backdrop': '9998',
      },
      keyframes: {
        highlight: {
          '0%, 100%': { boxShadow: '0 0 0 2px rgba(34, 197, 94, 0)' },
          '15%, 35%, 55%, 75%': { boxShadow: '0 0 20px 5px rgba(234, 179, 8, 0.6)' },
        }
      },
      animation: {
        highlight: 'highlight 3.5s ease-in-out',
      }
    }
  },
  plugins: [],
} 