
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    react() as any,
    cloudflare({ viteEnvironment: { name: 'worker' } })
  ],
  environments: {
    worker: {
      build: {
        sourcemap: true
      }
    }
  }
})
