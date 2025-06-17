<template>
  <v-app>
    <v-app-bar elevation="1">
      <v-app-bar-title class="text-h5 font-weight-bold">
        <router-link to="/" class="text-decoration-none text-black">InstaApp</router-link>
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <div v-if="authStore.isAuthenticated">
        <v-btn to="/" variant="text" class="mx-1">Home</v-btn>
        <v-btn to="/upload" variant="text" class="mx-1">Upload</v-btn>
        <v-btn to="/profile" variant="text" class="mx-1">Profile</v-btn>
        <v-btn @click="handleLogout" variant="text" class="mx-1">Logout</v-btn>
      </div>
      <div v-else>
        <v-btn to="/login" variant="text" class="mx-1">Login</v-btn>
        <v-btn to="/register" variant="text" class="mx-1">Register</v-btn>
      </div>
    </v-app-bar>

    <v-main>
      <v-container class="py-8 px-6" fluid>
        <router-view />
      </v-container>
    </v-main>

    <v-footer class="d-flex justify-center pa-4 text-caption text-grey">
      &copy; {{ new Date().getFullYear() }} InstaApp Szymon Kusior 4ib
    </v-footer>
  </v-app>
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
        console.log('checking auth')
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
import '@mdi/font/css/materialdesignicons.css'
</script>

<style>
/*
  Base styles are now handled by Vuetify.
  The v-app component establishes proper CSS resets and foundational styles.
*/
</style>
