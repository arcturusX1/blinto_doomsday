import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler: memoizes components and hooks automatically at build time
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    // Forward /api requests to the Express backend during development
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
