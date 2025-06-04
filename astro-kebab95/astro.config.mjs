// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue"; // Jika Anda masih menggunakannya

export default defineConfig({
  integrations: [
    tailwind(),
    vue() // Jika Anda masih menggunakannya
  ]
});