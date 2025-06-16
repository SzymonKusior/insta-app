<template>
  <div class="login-view">
    <div class="auth-container">
      <LoginForm />
      <div class="register-link">
        Don't have an account?
        <router-link to="/register">Register</router-link>
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
}

.auth-container {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 20px;
  width: 100%;
  max-width: 450px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dbdbdb;
  font-size: 14px;
}

.register-link a {
  color: #0095f6;
  text-decoration: none;
  font-weight: 600;
}
</style>
