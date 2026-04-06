import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import baseConfig from '../../vite.config'

export default mergeConfig(baseConfig, defineConfig({
  plugins: [react()],
}))
