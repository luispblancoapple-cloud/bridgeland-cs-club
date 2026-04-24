import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace '/bridgeland-cs-club/' with your actual GitHub repo name
// e.g. if your repo is github.com/LuisBlanco62/bcs-site → base: '/bcs-site/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
