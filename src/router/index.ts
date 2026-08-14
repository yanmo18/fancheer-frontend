import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'messages', name: 'messages', component: () => import('@/views/MessagesView.vue'), meta: { requiresAuth: true } },
        { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { requiresAuth: true } },
        { path: 'checkin', name: 'checkin', component: () => import('@/views/CheckinView.vue'), meta: { requiresAuth: true } },
      ],
    },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'admin', component: () => import('@/views/admin/AdminHomeView.vue') },
        { path: 'banners', name: 'admin-banners', component: () => import('@/views/admin/BannerAdminView.vue') },
        { path: 'songs', name: 'admin-songs', component: () => import('@/views/admin/SongAdminView.vue') },
        { path: 'activities', name: 'admin-activities', component: () => import('@/views/admin/ActivityAdminView.vue') },
        { path: 'gallery', name: 'admin-gallery', component: () => import('@/views/admin/GalleryAdminView.vue') },
        { path: 'awards', name: 'admin-awards', component: () => import('@/views/admin/AwardAdminView.vue') },
        { path: 'graph', name: 'admin-graph', component: () => import('@/views/admin/GraphAdminView.vue') },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UserAdminView.vue') },
        { path: 'messages', name: 'admin-messages', component: () => import('@/views/admin/MessageAdminView.vue') },
        { path: 'sensitive-words', name: 'admin-sensitive-words', component: () => import('@/views/admin/SensitiveWordAdminView.vue') },
        { path: 'streamer', name: 'admin-streamer', component: () => import('@/views/admin/StreamerAdminView.vue') },
        { path: 'avatars', name: 'admin-avatars', component: () => import('@/views/admin/AvatarAdminView.vue') },
        { path: 'logs', name: 'admin-logs', component: () => import('@/views/admin/LogAdminView.vue') },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.token && !auth.user) {
    await auth.fetchMe()
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'home' }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'home' }
  }
})

export default router
