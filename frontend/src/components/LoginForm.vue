<!-- frontend/src/components/LoginForm.vue -->
<template>
  <div class="login-form">
    <h2>Login to InstaApp</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <div v-if="authStore.getError" class="error-message">
        {{ authStore.getError }}
      </div>

      <button type="submit">
        <template v-if="!authStore.isLoading">Login</template>
        <template v-if="authStore.isLoading">
          Logging in...
          <span class="loader"></span>
        </template>
      </button>
    </form>
  </div>
</template>

<script>
import { useAuthStore } from '@/store'

export default {
  name: 'LoginForm',

  data() {
    return {
      email: '',
      password: '',
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
      await this.authStore.login({
        email: this.email,
        password: this.password,
      })

      if (this.authStore.isAuthenticated) {
        this.$router.push('/')
      }
    },
  },
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #0095f6;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message {
  color: red;
  margin: 10px 0;
}

.loader {
  width: 15px;
  height: 15px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  margin-left: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
