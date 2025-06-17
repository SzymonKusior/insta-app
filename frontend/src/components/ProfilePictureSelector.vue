<template>
  <div class="profile-picture-selector">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <div v-if="images.length" class="mt-2">
      <!-- Debug info to help troubleshoot -->
      <div class="text-caption text-grey mb-2">Found {{ images.length }} profile images</div>

      <v-row>
        <v-col
          v-for="(img, idx) in images"
          :key="`${img}-${refreshKey}`"
          cols="6"
          sm="4"
          md="3"
          lg="2"
        >
          <v-card
            @click="selectedIdx = idx"
            :elevation="selectedIdx === idx ? 8 : 2"
            :class="{ 'border-primary': selectedIdx === idx }"
            class="image-card"
          >
            <v-img
              :src="getImageUrl(img)"
              width="100"
              height="100"
              cover
              :alt="`Profile option ${idx + 1}`"
              @error="handleImageError(idx, img)"
              class="image-preview"
            ></v-img>
            <v-card-subtitle class="text-center pa-1" style="font-size: 10px">
              {{ getImageLabel(img) }}
            </v-card-subtitle>

            <!-- Add fallback for debugging -->
            <div v-if="imageErrors[idx]" class="pa-2 text-center text-error text-caption">
              Failed to load
              <v-btn x-small text @click.stop="retryImage(idx)">Retry</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-alert v-else-if="!loading" type="info" variant="tonal" class="mb-4">
      No profile pictures available. Please upload one.
    </v-alert>

    <v-btn
      :disabled="selectedIdx === null || settingPicture"
      @click="setProfilePictureHandler"
      color="primary"
      class="mt-4"
      block
      :loading="settingPicture"
    >
      {{ settingPicture ? 'Setting...' : 'Set as Profile Picture' }}
    </v-btn>
  </div>
</template>

<script>
import { getProfileImages, setProfilePicture } from '@/api'
import useProfileStore from '@/store/profile'

export default {
  name: 'ProfilePictureSelector',
  emits: ['selected'],
  props: {
    refreshTrigger: {
      type: Number,
      default: 0,
    },
    newImages: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      images: [],
      selectedIdx: null,
      loading: false,
      settingPicture: false,
      error: '',
      refreshKey: 0,
      imageErrors: {}, // Use a regular object in Options API
    }
  },
  watch: {
    refreshTrigger() {
      console.log('[ProfilePictureSelector] Refresh triggered')
      this.fetchImages()
    },
    newImages: {
      handler(newImages) {
        if (newImages && newImages.length) {
          console.log('[ProfilePictureSelector] Received new images:', newImages)
          this.images = [...newImages]
          this.selectedIdx = null
          this.imageErrors = {} // Simply reset with a new empty object
          this.refreshKey++
        }
      },
      deep: true,
    },
  },
  methods: {
    async fetchImages() {
      this.loading = true
      this.error = ''
      this.imageErrors = {} // Simply reset with a new empty object

      try {
        console.log('[ProfilePictureSelector] Fetching profile images...')
        const response = await getProfileImages()
        console.log('[ProfilePictureSelector] Images response:', response)

        if (response.images && response.images.length > 0) {
          this.images = response.images
          console.log('[ProfilePictureSelector] Using clean image paths:', this.images)
        } else {
          this.images = []
        }

        this.selectedIdx = null
        this.refreshKey++
      } catch (err) {
        console.error('[ProfilePictureSelector] Error fetching images:', err)
        this.error = err.message || 'Failed to load images'
      } finally {
        this.loading = false
      }
    },

    async setProfilePictureHandler() {
      if (this.selectedIdx === null) return

      const selectedImage = this.images[this.selectedIdx]
      // Remove any query params if they somehow exist
      const cleanImagePath = selectedImage.split('?')[0]

      this.settingPicture = true
      this.error = ''

      try {
        console.log('[ProfilePictureSelector] Setting profile picture:', cleanImagePath)
        await setProfilePicture({ profilePicture: cleanImagePath })
        console.log('[ProfilePictureSelector] Profile picture set successfully')
        this.$emit('selected', cleanImagePath)
      } catch (err) {
        console.error('[ProfilePictureSelector] Error setting picture:', err)
        this.error = err.message || 'Failed to set profile picture'
      } finally {
        this.settingPicture = false
      }
    },

    getImageUrl(imagePath) {
      if (!imagePath) return ''

      // If it's already a full URL, return it
      if (imagePath.startsWith('http')) {
        return imagePath
      }

      // If the path already starts with /upload, use it directly
      if (imagePath.startsWith('/upload')) {
        return `http://localhost:3000${imagePath}`
      }

      // For other paths, prepend the API base URL
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
      return `http://localhost:3000${normalizedPath}`
    },

    getImageLabel(imagePath) {
      if (!imagePath) return 'Unknown'

      // Extract a user-friendly label from the image path
      const filename = imagePath.split('/').pop().split('?')[0] || imagePath

      if (filename.includes('square-with-gradient')) return 'Gradient'
      if (filename.includes('square-with-letters')) return 'Letters'
      if (filename.includes('square-with-pattern')) return 'Pattern'
      if (filename.includes('with-border')) return 'Border'
      if (filename.includes('rounded')) return 'Rounded'
      if (filename.includes('square')) return 'Square'
      if (filename.includes('profile.png') || filename.includes('cropped.png')) return 'Original'

      return 'Style'
    },

    // Track image loading errors - Standard Options API
    handleImageError(idx, imagePath) {
      console.error(`[ProfilePictureSelector] Failed to load image at index ${idx}:`, imagePath)
      // Use Vue.set if available, otherwise directly set the property
      if (this.$set) {
        this.$set(this.imageErrors, idx, true)
      } else {
        this.imageErrors = { ...this.imageErrors, [idx]: true }
      }
    },

    // Retry loading an image - Standard Options API
    retryImage(idx) {
      if (this.$set) {
        this.$set(this.imageErrors, idx, false)
      } else {
        this.imageErrors = { ...this.imageErrors, [idx]: false }
      }
      this.refreshKey++
    },

    // Open image in new tab for debugging
  },
  mounted() {
    this.fetchImages()
  },
}
</script>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}

.image-card {
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  border-radius: 8px;
  min-height: 120px; /* Ensure height even if image fails to load */
  display: flex;
  flex-direction: column;
}

.image-card:hover {
  transform: scale(1.05);
}

.image-preview {
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.debug-section {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-top: 16px;
}
</style>
