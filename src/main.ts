import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { onSessionExpired } from '@/utils/sessionExpired'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.config.errorHandler = (err, _instance, info) => {
  console.error('[vue]', info, err)
}

app.use(pinia)
app.use(router)

onSessionExpired(() => {
  const auth = useAuthStore()
  auth.clearSession()
  const { meta, fullPath } = router.currentRoute.value
  if (meta.requiresAuth || meta.requiresAdmin) {
    void router.push({ name: 'login', query: { redirect: fullPath } })
  }
})

app.mount('#app')
