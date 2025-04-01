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
          '0%, 30%, 60%, 100%': { boxShadow: '0 0 0 2px rgba(34, 197, 94, 0)' },
          '15%, 45%': { boxShadow: '0 0 20px 2px rgba(34, 197, 94, 0.5)' },
        }
      },
      animation: {
        highlight: 'highlight 3s ease-in-out',
      }
    }
  },
  plugins: [],
} 