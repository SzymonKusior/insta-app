<template>
  <v-container class="single-photo-view">
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="d-block mx-auto my-8"
    ></v-progress-circular>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-card v-else-if="photo" class="mx-auto" max-width="900" elevation="3">
      <v-btn icon="mdi-arrow-left" variant="text" size="small" class="ma-2" @click="goBack"></v-btn>

      <v-img
        :src="getPhotoUrl(photo)"
        :alt="photo.originalName"
        max-height="600"
        class="mx-auto"
        contain
      ></v-img>

      <v-card-title class="text-h5">{{ photo.originalName }}</v-card-title>

      <v-card-subtitle>
        <v-icon icon="mdi-account" size="small" class="mr-1"></v-icon>
        {{ photo.album }}
      </v-card-subtitle>

      <v-divider class="mx-4 my-2"></v-divider>

      <v-card-text v-if="photo.tags && photo.tags.length">
        <div class="text-subtitle-2 mb-2">Tags:</div>
        <v-chip
          v-for="tag in photo.tags"
          :key="tag.id"
          size="small"
          class="ma-1"
          color="primary-lighten-4"
          variant="outlined"
        >
          {{ tag.name }}
        </v-chip>
      </v-card-text>

      <v-card-actions v-if="isOwner">
        <v-btn
          color="error"
          variant="tonal"
          block
          prepend-icon="mdi-delete"
          @click="confirmDelete"
          :loading="deleting"
        >
          Delete Photo
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete Photo</v-card-title>
        <v-card-text
          >Are you sure you want to delete this photo? This action cannot be undone.</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deletePhoto">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore, useAuthStore } from '@/store'
import { getPhotoUrl } from '@/api'

export default {
  name: 'SinglePhotoView',

  setup() {
    const route = useRoute()
    const router = useRouter()
    const photoStore = usePhotoStore()
    const authStore = useAuthStore()

    const photoId = route.params.id
    const photo = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const deleting = ref(false)
    const deleteDialog = ref(false)

    // Check if current user is the owner of the photo
    const isOwner = computed(() => {
      if (!photo.value || !authStore.user) return false
      return photo.value.album === authStore.user.email
    })

    const fetchPhoto = async () => {
      loading.value = true
      error.value = null

      try {
        await photoStore.fetchPhotoById(photoId)
        photo.value = photoStore.currentPhoto

        if (!photo.value) {
          error.value = 'Photo not found'
        }
      } catch (err) {
        console.error('Error fetching photo:', err)
        error.value = 'Failed to load photo. Please try again.'
      } finally {
        loading.value = false
      }
    }

    const confirmDelete = () => {
      deleteDialog.value = true
    }

    const deletePhoto = async () => {
      deleting.value = true
      try {
        await photoStore.removePhoto(photoId)
        deleteDialog.value = false
        router.push('/')
      } catch (err) {
        console.error('Error deleting photo:', err)
        error.value = 'Failed to delete photo'
      } finally {
        deleting.value = false
      }
    }

    const goBack = () => {
      router.back()
    }

    onMounted(() => {
      fetchPhoto()
    })

    return {
      photo,
      loading,
      error,
      isOwner,
      deleting,
      deleteDialog,
      getPhotoUrl,
      confirmDelete,
      deletePhoto,
      goBack,
    }
  },
}
</script>

<style scoped>
.single-photo-view {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
</style>
