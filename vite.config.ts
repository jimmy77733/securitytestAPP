import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { saveQuestionImagesPlugin } from './scripts/vite-plugin-save-question-images.js'

export default defineConfig({
  plugins: [react(), saveQuestionImagesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

