<template>
  <div class="login-view">
    <div class="auth-container">
      <LoginForm />

      <v-divider class="my-4"></v-divider>

      <div class="text-center">
        Don't have an account?
        <v-btn variant="text" color="primary" to="/register">Register</v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from '../components/LoginForm.vue'

export default {
  name: 'LoginView',
  components: {
    LoginForm,
  },
}
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 500px;
}
</style>
