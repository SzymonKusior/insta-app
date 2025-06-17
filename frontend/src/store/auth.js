import { defineStore } from 'pinia'
import { loginUser, registerUser, getUserProfile } from '@/api'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userEmail: (state) => state.user?.email || '',
    getUser: (state) => state.user, // <-- Add this line
  },
  actions: {
    async register(userData) {
      this.loading = true
      this.error = null
      try {
        const response = await registerUser(userData)
        return { success: true, data: response }
      } catch (err) {
        this.error = err.message || 'Registration failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
    async checkAuthStatus() {
      return await this.initAuth()
    },
    async initAuth() {
      if (this.token) {
        this.loading = true
        try {
          const userData = await getUserProfile()
          this.user = userData.user
          this.loading = false
          return true
        } catch (err) {
          console.error('Failed to restore auth state:', err)
          this.token = null
          this.user = null
          localStorage.removeItem('token')
          this.loading = false
          this.error = 'Session expired. Please log in again.'
          return false
        }
      }
      return false
    },
    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        // Make sure loginUser expects an object or two arguments
        const data = await loginUser({ email, password })
        if (data.token) {
          this.token = data.token
          localStorage.setItem('token', data.token)
          const userData = await getUserProfile()
          this.user = userData
        } else {
          throw new Error(data.message || 'Login failed')
        }
      } catch (err) {
        this.error = err.message || 'An error occurred during login'
        this.token = null
        this.user = null
        localStorage.removeItem('token')
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },
    setUser(userData) {
      this.user = userData
    },
  },
})

export default useAuthStore
