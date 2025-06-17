<template>
  <div class="profile-photos">
    <h2 class="text-h5 mb-6">My Photos</h2>

    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="d-block mx-auto my-8"
    ></v-progress-circular>

    <v-sheet v-else-if="!photos.length" class="pa-8 rounded text-center" color="grey-lighten-4">
      <v-icon icon="mdi-image-off" size="large" color="grey" class="mb-4"></v-icon>
      <p class="text-body-1 mb-4">You haven't uploaded any photos yet.</p>
      <v-btn to="/upload" color="primary" prepend-icon="mdi-upload">
        Upload Your First Photo
      </v-btn>
    </v-sheet>

    <v-row v-else>
      <v-col v-for="photo in photos" :key="photo.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="photo-card" elevation="2">
          <v-img :src="getPhotoUrl(photo)" :alt="photo.originalName" height="200" cover></v-img>

          <v-overlay
            activator="parent"
            location-strategy="connected"
            class="align-end"
            scrim="black"
            scroll-strategy="close"
          >
            <v-card class="pa-2 bg-black-opacity-50" flat>
              <v-card-title class="text-h6 text-white pa-1">
                {{ photo.originalName }}
              </v-card-title>

              <v-card-subtitle class="text-white pa-1"> Album: {{ photo.album }} </v-card-subtitle>

              <div v-if="photo.tags && photo.tags.length" class="px-1 py-2">
                <v-chip
                  v-for="tag in photo.tags"
                  :key="tag.name"
                  size="small"
                  class="ma-1"
                  color="primary-lighten-4"
                  variant="outlined"
                >
                  {{ tag.name }}
                </v-chip>
              </div>

              <v-card-actions class="pa-1">
                <v-btn
                  color="error"
                  variant="tonal"
                  block
                  prepend-icon="mdi-delete"
                  @click="deletePhoto(photo.id)"
                >
                  Delete
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { usePhotoStore, useAuthStore } from '@/store'
import { getPhotoUrl, getUserPhotos } from '@/api'
import { useRouter } from 'vue-router'

export default {
  name: 'ProfilePhotos',

  setup() {
    const photoStore = usePhotoStore()
    const authStore = useAuthStore()
    const photos = ref([])
    const loading = ref(true)
    const router = useRouter()

    // Use computed for user email
    const userEmail = computed(() => authStore.user?.email || '')

    // Check authentication status on mount
    onMounted(async () => {
      await authStore.checkAuthStatus()

      if (!authStore.isAuthenticated) {
        router.push('/login')
      }
      fetchUserPhotos()
    })

    const fetchUserPhotos = async () => {
      loading.value = true
      try {
        if (!userEmail.value) {
          console.error('User email not available')
          loading.value = false
          return
        }

        console.log('Fetching photos for user email:', userEmail.value)

        // Use the computed email to fetch user photos
        const userPhotos = await getUserPhotos(userEmail.value)
        photos.value = userPhotos
        console.log(userPhotos)
      } catch (error) {
        console.error('Error fetching user photos:', error)
      } finally {
        loading.value = false
      }
    }

    const deletePhoto = async (photoId) => {
      if (confirm('Are you sure you want to delete this photo?')) {
        try {
          await photoStore.removePhoto(photoId)
          // Remove from local array
          photos.value = photos.value.filter((photo) => photo.id !== photoId)
        } catch (error) {
          console.error('Error deleting photo:', error)
        }
      }
    }

    onMounted(() => {
      fetchUserPhotos()
    })

    return {
      photos,
      loading,
      deletePhoto,
      userEmail,
      getPhotoUrl,
    }
  },
}
</script>

<style scoped>
.photo-card {
  transition: transform 0.2s;
  height: 100%;
}

.photo-card:hover {
  transform: translateY(-5px);
}

.bg-black-opacity-50 {
  background-color: rgba(0, 0, 0, 0.5) !important;
}
</style>
