import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Only so `app.css?raw` returns its text in tests that inject the real
    // stylesheet; keep the pattern narrow so other suites stay unstyled.
    css: { include: [/app\.css/] },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})

