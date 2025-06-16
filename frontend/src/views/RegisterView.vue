<template>
  <div class="register-view">
    <div class="auth-container">
      <!-- Registration form - shown initially -->
      <div v-if="!confirmationToken">
        <h2>Create an Account</h2>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" v-model="formData.username" required />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" v-model="formData.lastName" required />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="formData.email" required />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="formData.password" required />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              required
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" :disabled="authStore.isLoading">
            <template v-if="!authStore.isLoading">Register</template>
            <template v-else>
              Registering...
              <span class="loader"></span>
            </template>
          </button>
        </form>

        <div class="login-link">
          Already have an account?
          <router-link to="/login">Login</router-link>
        </div>
      </div>

      <!-- Confirmation section - shown after registration -->
      <div v-else class="confirmation-section">
        <div class="success-icon">✓</div>
        <h2>Almost Done!</h2>
        <p>
          Your account has been created successfully. Please click the button below to confirm your
          account and start using the platform.
        </p>

        <button @click="confirmAccount" class="confirm-button" :disabled="confirmationLoading">
          <template v-if="!confirmationLoading">Confirm Account</template>
          <template v-else>
            Confirming...
            <span class="loader"></span>
          </template>
        </button>

        <div v-if="confirmationError" class="error-message">
          {{ confirmationError }}
        </div>

        <div v-if="confirmationSuccess" class="success-message">
          {{ confirmationSuccess }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/store'
import { confirmUserAccount } from '@/api'

export default {
  name: 'RegisterView',

  data() {
    return {
      formData: {
        username: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      error: null,
      confirmationToken: null,
      confirmationLoading: false,
      confirmationError: null,
      confirmationSuccess: null,
    }
  },

  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },

  methods: {
    async handleRegister() {
      this.error = null

      // Validate passwords match
      if (this.formData.password !== this.formData.confirmPassword) {
        this.error = 'Passwords do not match'
        return
      }

      // Basic password validation
      if (this.formData.password.length < 6) {
        this.error = 'Password must be at least 6 characters long'
        return
      }

      try {
        const result = await this.authStore.register({
          name: this.formData.username,
          lastName: this.formData.lastName,
          email: this.formData.email,
          password: this.formData.password,
        })

        console.log('Registration result:', result)

        // Handle different response structures
        const token = result?.data?.token || result?.token || result?.confirmationToken

        if (token) {
          this.confirmationToken = token
        } else {
          // If no token but registration was successful, show success message
          this.error =
            'Registration completed successfully. Please check your email for confirmation instructions.'
        }
      } catch (err) {
        console.error('Registration error:', err)
        this.error =
          err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      }
    },

    async confirmAccount() {
      if (!this.confirmationToken) {
        this.confirmationError = 'No confirmation token available'
        return
      }

      this.confirmationLoading = true
      this.confirmationError = null
      this.confirmationSuccess = null

      try {
        const result = await confirmUserAccount(this.confirmationToken)
        console.log('Confirmation result:', result)

        this.confirmationSuccess = 'Account confirmed successfully! Logging you in...'

        // Wait a moment for user to see the success message
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Attempt automatic login
        try {
          const loginResult = await this.authStore.login({
            email: this.formData.email,
            password: this.formData.password,
          })

          console.log('Auto-login result:', loginResult)

          if (this.authStore.isAuthenticated) {
            this.confirmationSuccess = 'Welcome!'
            setTimeout(() => {
              this.$router.push('/')
            }, 1000)
          } else {
            throw new Error('Authentication check failed')
          }
        } catch (loginErr) {
          console.error('Auto-login failed:', loginErr)
          this.confirmationError =
            'Account confirmed successfully, but automatic login failed. Redirecting to login page...'
          setTimeout(() => {
            this.$router.push('/login')
          }, 2000)
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        this.confirmationError =
          err.response?.data?.message ||
          err.message ||
          'Account confirmation failed. Please try again.'
      } finally {
        this.confirmationLoading = false
      }
    },
  },
}
</script>

<style scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.auth-container {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 30px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

input {
  padding: 12px;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #0095f6;
  box-shadow: 0 0 0 2px rgba(0, 149, 246, 0.1);
}

button {
  background: #0095f6;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background: #0084d6;
}

button:disabled {
  background: #8fc5e9;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  padding: 10px;
  background: #fdf2f2;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 14px;
}

.success-message {
  color: #27ae60;
  text-align: center;
  padding: 10px;
  background: #f0f8f0;
  border: 1px solid #c3e6c3;
  border-radius: 4px;
  font-size: 14px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dbdbdb;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #0095f6;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
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

.confirmation-section {
  text-align: center;
}

.success-icon {
  font-size: 48px;
  color: #27ae60;
  margin-bottom: 15px;
}

.confirmation-section p {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

.confirm-button {
  margin: 20px auto;
  min-width: 150px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 20px;
    margin: 10px;
  }
}
</style>
