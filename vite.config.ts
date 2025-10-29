import { defineConfig } from 'vite'

// IMPORTANT: Replace 'YOUR_REPO_NAME' with your GitHub repo name OR set BASE via env.
// Example: BASE=/T2D   → site served at https://<user>.github.io/T2D/
const BASE = process.env.BASE || '/YOUR_REPO_NAME/'

export default defineConfig({
  base: BASE,
})