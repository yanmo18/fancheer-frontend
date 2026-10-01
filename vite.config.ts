import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

/** Vite 默认 public；本地目录写成 pub 时同样作为静态根目录 */
function resolvePublicDir() {
  if (existsSync(join(projectRoot, 'public', 'assets', 'header.jpg'))) return 'public'
  if (existsSync(join(projectRoot, 'pub', 'assets', 'header.jpg'))) return 'pub'
  if (existsSync(join(projectRoot, 'public', 'header.jpg'))) return 'public'
  if (existsSync(join(projectRoot, 'pub', 'header.jpg'))) return 'pub'
  return 'public'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = `http://localhost:${env.VITE_API_PORT || '3001'}`

  return {
    plugins: [vue()],
    publicDir: resolvePublicDir(),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/uploads': { target: apiTarget, changeOrigin: true },
      },
    },
    optimizeDeps: {
      // 仅预构建 echarts；不要 include vue，否则重启时可能触发 shallowRef is not a function
      include: ['echarts'],
    },
  }
})
