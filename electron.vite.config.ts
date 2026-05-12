import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main_window: resolve(__dirname, 'src/renderer/index.html'),
          fab_window: resolve(__dirname, 'src/renderer/fab.html')
        }
      }
    }
  }
})
