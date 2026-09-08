import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const host = process.env.TAURI_DEV_HOST

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    // Dev: full SSR so `/` renders. Build: SPA shell for Tauri static assets.
    tanstackStart(
      command === 'build'
        ? {
            spa: {
              enabled: true,
              prerender: {
                outputPath: '/index.html',
                crawlLinks: false,
                retryCount: 0,
              },
            },
          }
        : undefined,
    ),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Bind IPv4 so Tauri/WebView2 can reach http://localhost:1420
    host: host || '127.0.0.1',
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
}))

export default config
