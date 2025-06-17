import { createRouter, createWebHistory } from 'vue-router'
import pinia from '@/store'

// Import components
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileView from '../views/ProfileView.vue'
import PhotoUploadView from '../views/PhotoUploadView.vue'
import SinglePhotoView from '../views/SinglePhotoView.vue' // Import the new view

// Router configuration
const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/upload', component: PhotoUploadView, meta: { requiresAuth: true } },
  {
    path: '/photo/:id',
    name: 'SinglePhoto',
    component: SinglePhotoView,
    meta: {
      requiresAuth: false,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards
// router.beforeEach((to, from, next) => {
//   const authStore = pinia.state.value.authStore
//   console.log('Auth Store:', authStore)

// const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

// if (requiresAuth && !authStore?.token) {
//   next('/login')
// } else {
//   next()
// }
// })

export default router
