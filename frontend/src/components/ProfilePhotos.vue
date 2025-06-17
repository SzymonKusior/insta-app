<template>
  <div class="profile-photos">
    <h2>My Photos</h2>

    <div v-if="loading" class="loading">Loading your photos...</div>

    <div v-else-if="!photos.length" class="no-photos">
      <p>You haven't uploaded any photos yet.</p>
      <router-link to="/upload" class="upload-btn">
        <i class="pi pi-upload"></i> Upload Your First Photo
      </router-link>
    </div>

    <div v-else class="photos-grid">
      <div v-for="photo in photos" :key="photo.id" class="photo-card">
        <img :src="getPhotoUrl(photo)" :alt="photo.originalName" />

        <div class="photo-overlay">
          <h3>{{ photo.originalName }}</h3>
          <p>Album: {{ photo.album }}</p>

          <div v-if="photo.tags && photo.tags.length" class="tags">
            <span v-for="tag in photo.tags" :key="tag.name" class="tag">{{ tag.name }}</span>
          </div>

          <button @click="deletePhoto(photo.id)" class="delete-btn">
            <i class="pi pi-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
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
      userEmail, // Export if you want to use it in the template
      getPhotoUrl,
    }
  },
}
</script>

<style scoped>
.profile-photos {
  margin-top: 20px;
}

.profile-photos h2 {
  margin-bottom: 20px;
  font-size: 22px;
}

.loading,
.no-photos {
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #0095f6;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background-color: #0077c5;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.photo-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.photo-card:hover {
  transform: translateY(-5px);
}

.photo-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.photo-card:hover .photo-overlay {
  transform: translateY(0);
}

.photo-overlay h3 {
  margin: 0 0 5px;
  font-size: 16px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 8px 0;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.delete-btn {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.delete-btn:hover {
  background-color: #d9342b;
}
</style>
