<!-- frontend/src/components/LoginForm.vue -->
<template>
  <v-card class="login-form mx-auto" max-width="500" elevation="4">
    <v-card-title class="text-center text-h5 py-4"> Login to InstaApp </v-card-title>

    <v-card-text>
      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          prepend-inner-icon="mdi-email"
          variant="outlined"
          required
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          prepend-inner-icon="mdi-lock"
          variant="outlined"
          required
        ></v-text-field>

        <v-alert v-if="loginError" type="error" variant="tonal" class="mb-4">
          {{ loginError }}
        </v-alert>

        <v-btn type="submit" color="primary" block :loading="authStore.isLoading" class="mt-2">
          {{ authStore.isLoading ? 'Logging in...' : 'Login' }}
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import { useAuthStore } from '@/store'
import { ref, computed } from 'vue'

export default {
  name: 'LoginForm',

  data() {
    return {
      email: '',
      password: '',
      loginError: '',
    }
  },

  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },

  methods: {
    async handleLogin() {
      this.loginError = '' // Clear previous errors

      try {
        await this.authStore.login({
          email: this.email,
          password: this.password,
        })

        if (this.authStore.isAuthenticated) {
          this.$router.push('/')
        } else {
          // If we're not authenticated after login attempt
          this.loginError = 'Login failed. Please check your credentials.'
        }
      } catch (error) {
        // Handle any exceptions during login
        console.error('Login error:', error)
        this.loginError = 'An error occurred during login. Please try again.'
      }
    },
  },
}
</script>

<style scoped>
.login-form {
  margin-top: 2rem;
  padding: 1rem;
}
</style>
