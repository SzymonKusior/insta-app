<template>
  <div class="register-view">
    <v-card class="register-card mx-auto" max-width="500" elevation="4">
      <!-- Registration form - shown initially -->
      <div v-if="!confirmationToken">
        <v-card-title class="text-center text-h5 py-4"> Create an Account </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="handleRegister">
            <v-text-field
              v-model="formData.username"
              label="Username"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              required
            ></v-text-field>

            <v-text-field
              v-model="formData.lastName"
              label="Last Name"
              prepend-inner-icon="mdi-account-outline"
              variant="outlined"
              required
            ></v-text-field>

            <v-text-field
              v-model="formData.email"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              required
            ></v-text-field>

            <v-text-field
              v-model="formData.password"
              label="Password"
              type="password"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              required
            ></v-text-field>

            <v-text-field
              v-model="formData.confirmPassword"
              label="Confirm Password"
              type="password"
              prepend-inner-icon="mdi-lock-check"
              variant="outlined"
              required
            ></v-text-field>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
              {{ error }}
            </v-alert>

            <v-btn type="submit" color="primary" block :loading="authStore.isLoading" class="mt-2">
              Register
            </v-btn>
          </v-form>

          <v-divider class="my-4"></v-divider>

          <div class="text-center">
            Already have an account?
            <v-btn variant="text" color="primary" to="/login">Login</v-btn>
          </div>
        </v-card-text>
      </div>

      <!-- Confirmation section - shown after registration -->
      <div v-else class="confirmation-section">
        <v-card-text class="text-center py-4">
          <v-icon color="success" size="x-large" icon="mdi-check-circle" class="mb-4"></v-icon>

          <h2 class="text-h5 mb-4">Almost Done!</h2>

          <p class="text-body-1 mb-6">
            Your account has been created successfully. Please click the button below to confirm
            your account and start using the platform.
          </p>

          <v-btn
            @click="confirmAccount"
            color="primary"
            :loading="confirmationLoading"
            size="large"
            class="mb-4"
          >
            Confirm Account
          </v-btn>

          <v-alert v-if="confirmationError" type="error" variant="tonal" class="mb-4">
            {{ confirmationError }}
          </v-alert>

          <v-alert v-if="confirmationSuccess" type="success" variant="tonal" class="mb-4">
            {{ confirmationSuccess }}
          </v-alert>
        </v-card-text>
      </div>
    </v-card>
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

.register-card {
  width: 100%;
  padding: 1rem;
}
</style>
