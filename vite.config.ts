import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 80,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  define: {
    'process.env.VITE_INFLUXDB_URL': JSON.stringify(process.env.VITE_INFLUXDB_URL),
    'process.env.VITE_INFLUXDB_TOKEN': JSON.stringify(process.env.VITE_INFLUXDB_TOKEN),
    'process.env.VITE_INFLUXDB_ORG': JSON.stringify(process.env.VITE_INFLUXDB_ORG),
    'process.env.VITE_INFLUXDB_BUCKET': JSON.stringify(process.env.VITE_INFLUXDB_BUCKET),
    'process.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY)
  }
})
