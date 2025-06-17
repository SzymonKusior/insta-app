<template>
  <v-container class="profile-container">
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="d-block mx-auto my-8"
    ></v-progress-circular>

    <v-card v-else-if="!currentUser.email" class="pa-4 text-center" elevation="2">
      <v-icon icon="mdi-account-alert" size="large" color="warning" class="mb-4"></v-icon>
      <h2 class="text-h5 mb-4">Unable to load profile</h2>
      <p class="mb-4">We couldn't load your profile information. Please try again.</p>
      <v-btn color="primary" @click="refreshUserData">Reload Profile</v-btn>
    </v-card>

    <v-card v-else class="pa-4" elevation="2">
      <v-row class="profile-header">
        <v-col cols="12" sm="4" md="3" class="text-center">
          <v-avatar size="150" class="profile-avatar">
            <v-img
              :src="
                currentUser.profilePicture
                  ? `http://localhost:3000${currentUser.profilePicture}`
                  : '/default-avatar.png'
              "
              alt="Profile picture"
              cover
            ></v-img>
          </v-avatar>
        </v-col>

        <v-col cols="12" sm="8" md="9">
          <div class="profile-info">
            <h1 class="text-h4 mb-2">{{ currentUser.name }} {{ currentUser.lastName }}</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              {{ currentUser.email }}
            </p>

            <v-btn-toggle v-model="currentView" color="primary" mandatory class="mt-4">
              <v-btn value="photos" prepend-icon="mdi-image-multiple"> My Photos </v-btn>
              <v-btn value="edit" prepend-icon="mdi-account-edit"> Edit Profile </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <div class="profile-content">
        <ProfilePhotos v-if="currentView === 'photos'" />

        <ProfileEdit
          v-else-if="currentView === 'edit'"
          :user="currentUser"
          @profile-updated="handleProfileUpdated"
        />
      </div>
    </v-card>
  </v-container>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/store'
import ProfilePhotos from '@/components/ProfilePhotos.vue'
import ProfileEdit from '@/components/ProfileEdit.vue'
import ProfilePictureUpload from '@/components/ProfilePictureUpload.vue'
import ProfilePictureSelector from '@/components/ProfilePictureSelector.vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Profile',

  components: {
    ProfilePhotos,
    ProfileEdit,
    ProfilePictureUpload,
    ProfilePictureSelector,
  },

  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const currentView = ref('photos')
    const selector = ref(null)
    const currentUser = ref({})
    const loading = ref(true)

    // Use computed for read-only reference to the store's user
    const user = computed(() => authStore.user || {})

    // Update the currentUser ref whenever the computed user changes
    const updateCurrentUser = () => {
      // Only update if user has data
      if (user.value && user.value.email) {
        // Create a deep copy to avoid reference issues
        currentUser.value = JSON.parse(JSON.stringify(user.value))
        console.log('Updated current user:', currentUser.value)
      }
    }

    // Watch for changes to the user data
    watch(
      () => authStore.user,
      (newUser) => {
        console.log('User updated in store:', newUser)
        updateCurrentUser()
      },
    )

    // Initialize auth and user data
    const initializeUserData = async () => {
      loading.value = true
      try {
        console.log('Initializing user data...')
        await authStore.checkAuthStatus()

        // If not authenticated after check, redirect to login
        if (!authStore.isAuthenticated) {
          console.log('Not authenticated, redirecting to login')
          router.push('/login')
          return
        }

        // Wait a moment to ensure data is loaded
        setTimeout(() => {
          updateCurrentUser()
          loading.value = false
        }, 300)
      } catch (error) {
        console.error('Error initializing user data:', error)
        loading.value = false
      }
    }

    // Function to manually refresh user data
    const refreshUserData = async () => {
      loading.value = true
      try {
        // Force reload auth state
        await authStore.initAuth()
        updateCurrentUser()
      } catch (error) {
        console.error('Error refreshing user data:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      initializeUserData()
    })

    const formatDate = (dateString) => {
      if (!dateString) return 'Unknown'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    const handleProfileUpdated = (updatedUser) => {
      // Replace updateUser with setUser or whatever method exists in your store
      authStore.setUser(updatedUser)
      // Update our local reference
      updateCurrentUser()
      // Switch to photos view after successful update
      currentView.value = 'photos'
    }

    const refreshSelector = () => {
      // Call fetchImages() on ProfilePictureSelector
      if (selector.value) selector.value.fetchImages()
    }

    const onProfilePicSelected = (url) => {
      // Update the auth store with new profile picture
      const updatedUser = { ...user.value, profilePicture: url }
      authStore.updateUser(updatedUser)
      // Update our local reference
      updateCurrentUser()
    }

    return {
      currentView,
      currentUser,
      authStore,
      formatDate,
      handleProfileUpdated,
      refreshSelector,
      onProfilePicSelected,
      selector,
      loading,
      refreshUserData,
    }
  },
}
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  align-items: center;
}

.profile-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>
