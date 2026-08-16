import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_DESCRIPTION, setPageMeta } from '@/utils/seo'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: { title: '首页', description: DEFAULT_DESCRIPTION },
        },
        {
          path: 'messages',
          name: 'messages',
          component: () => import('@/views/MessagesView.vue'),
          meta: {
            requiresAuth: true,
            title: '留言板',
            description: '与博主互动：公开留言、私密留言与博主回复。',
          },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true, title: '个人中心', description: '管理昵称与头像。' },
        },
        {
          path: 'checkin',
          name: 'checkin',
          component: () => import('@/views/CheckinView.vue'),
          meta: { requiresAuth: true, title: '每日打卡', description: '记录来访的每一天。' },
        },
        {
          path: 'terms',
          name: 'terms',
          component: () => import('@/views/TermsView.vue'),
          meta: { title: '用户协议', description: 'Fancheer 用户注册与使用协议。' },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true, title: '登录', description: '登录 Fancheer 账号。' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true, title: '注册', description: '注册 Fancheer 访客账号。' },
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: '管理后台' },
      children: [
        { path: '', name: 'admin', component: () => import('@/views/admin/AdminHomeView.vue'), meta: { title: '管理概览' } },
        { path: 'banners', name: 'admin-banners', component: () => import('@/views/admin/BannerAdminView.vue'), meta: { title: 'Banner 管理' } },
        { path: 'songs', name: 'admin-songs', component: () => import('@/views/admin/SongAdminView.vue'), meta: { title: '音乐管理' } },
        { path: 'activities', name: 'admin-activities', component: () => import('@/views/admin/ActivityAdminView.vue'), meta: { title: '活动管理' } },
        { path: 'gallery', name: 'admin-gallery', component: () => import('@/views/admin/GalleryAdminView.vue'), meta: { title: '图集管理' } },
        { path: 'awards', name: 'admin-awards', component: () => import('@/views/admin/AwardAdminView.vue'), meta: { title: '荣誉管理' } },
        { path: 'graph', name: 'admin-graph', component: () => import('@/views/admin/GraphAdminView.vue'), meta: { title: '关系图谱' } },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UserAdminView.vue'), meta: { title: '用户管理' } },
        { path: 'messages', name: 'admin-messages', component: () => import('@/views/admin/MessageAdminView.vue'), meta: { title: '留言与举报' } },
        { path: 'sensitive-words', name: 'admin-sensitive-words', component: () => import('@/views/admin/SensitiveWordAdminView.vue'), meta: { title: '敏感词管理' } },
        { path: 'streamer', name: 'admin-streamer', component: () => import('@/views/admin/StreamerAdminView.vue'), meta: { title: '博主资料' } },
        { path: 'avatars', name: 'admin-avatars', component: () => import('@/views/admin/AvatarAdminView.vue'), meta: { title: '预设头像' } },
        { path: 'logs', name: 'admin-logs', component: () => import('@/views/admin/LogAdminView.vue'), meta: { title: '操作日志' } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'not-found',
          component: () => import('@/views/NotFoundView.vue'),
          meta: { title: '页面未找到', description: '您访问的页面不存在。' },
        },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const needsSession = Boolean(to.meta.requiresAuth || to.meta.requiresAdmin)

  if (auth.token && !auth.user) {
    if (needsSession) {
      await Promise.race([
        auth.fetchMe(),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 5000)
        }),
      ])
    } else {
      void auth.fetchMe()
    }
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

  return true
})

router.onError((error) => {
  console.error('[router]', error)
})

router.afterEach((to) => {
  setPageMeta({
    title: to.meta.title,
    description: to.meta.description,
    path: to.fullPath,
  })
})

export default router
