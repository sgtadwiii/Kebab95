/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Kita akan gunakan ini untuk dark mode nanti
  theme: {
    extend: {
      fontFamily: {
        // Kita set Poppins sebagai font sans-serif utama
        sans: ['Poppins', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}