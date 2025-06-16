<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <router-link to="/">InstaAp</router-link>
      </div>
      <nav v-if="authStore.isAuthenticated">
        <router-link to="/">Home</router-link>
        <router-link to="/upload">Upload</router-link>
        <router-link to="/profile">Profile</router-link>
        <a href="#" @click.prevent="handleLogout">Logout</a>
      </nav>
      <nav v-else>
        <router-link to="/login">Login</router-link>
        <router-link to="/register">Register</router-link>
      </nav>
    </header>

    <main class="app-content">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 InstaAp</p>
    </footer>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useAuthStore } from '@/store'

export default {
  setup() {
    const authStore = useAuthStore()

    onMounted(async () => {
      try {
        // Call the checkAuthStatus function when the app mounts
        await authStore.checkAuthStatus()
      } catch (error) {
        console.error('Error checking authentication status:', error)
      }
    })

    return {
      authStore,
    }
  },

  methods: {
    handleLogout() {
      this.authStore.logout()
      this.$router.push('/login')
    },
  },
}
</script>
<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: #fafafa;
  color: #262626;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: white;
  padding: 15px 20px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo a {
  font-size: 24px;
  font-weight: bold;
  text-decoration: none;
  color: #262626;
}

nav {
  display: flex;
  gap: 20px;
}

nav a {
  text-decoration: none;
  color: #262626;
  font-weight: 500;
}

nav a.router-link-active {
  color: #0095f6;
}

.app-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  padding: 15px;
  background-color: white;
  border-top: 1px solid #dbdbdb;
  text-align: center;
  font-size: 14px;
  color: #8e8e8e;
}
</style>
