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
      }
    }
  },
  plugins: [],
} 