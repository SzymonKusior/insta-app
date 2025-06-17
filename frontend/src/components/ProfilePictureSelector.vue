<template>
  <div class="profile-picture-selector">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-row v-if="images.length" class="mt-2">
      <v-col v-for="(img, idx) in images" :key="idx" cols="6" sm="4" md="3" lg="2">
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
          ></v-img>
          <v-card-subtitle class="text-center pa-1" style="font-size: 10px">
            {{ getImageLabel(img) }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

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
    }
  },
  watch: {
    // Watch for refreshTrigger changes to reload images
    refreshTrigger() {
      this.fetchImages()
    },
    // Watch for new images passed directly from parent
    newImages: {
      handler(newImages) {
        if (newImages && newImages.length) {
          console.log('[ProfilePictureSelector] Received new images:', newImages)
          this.images = [...newImages]
          this.selectedIdx = null
        }
      },
      deep: true,
    },
  },
  methods: {
    async fetchImages() {
      this.loading = true
      this.error = ''
      try {
        console.log('[ProfilePictureSelector] Fetching profile images...')

        // Use the API function instead of direct axios call
        const response = await getProfileImages()
        console.log('[ProfilePictureSelector] Images response:', response)

        this.images = response.images || []
        this.selectedIdx = null // Reset selection when images change
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
      this.settingPicture = true
      this.error = ''

      try {
        console.log('[ProfilePictureSelector] Setting profile picture:', selectedImage)

        // Use the API function instead of direct axios call
        await setProfilePicture({ profilePicture: selectedImage })
        console.log('[ProfilePictureSelector] Profile picture set successfully')

        // Emit the selected image URL to parent
        this.$emit('selected', selectedImage)
      } catch (err) {
        console.error('[ProfilePictureSelector] Error setting picture:', err)
        this.error = err.message || 'Failed to set profile picture'
      } finally {
        this.settingPicture = false
      }
    },

    getImageUrl(imagePath) {
      // Handle both full URLs and relative paths
      if (imagePath.startsWith('http')) {
        return imagePath
      }
      // Construct the full URL based on your API structure
      return `http://localhost:3000${imagePath}`
    },

    getImageLabel(imagePath) {
      // Extract a user-friendly label from the image path
      const filename = imagePath.split('/').pop() || imagePath

      if (filename.includes('square-with-gradient')) return 'Gradient'
      if (filename.includes('square-with-letters')) return 'Letters'
      if (filename.includes('square-with-pattern')) return 'Pattern'
      if (filename.includes('with-border')) return 'Border'
      if (filename.includes('rounded')) return 'Rounded'
      if (filename.includes('square')) return 'Square'
      if (filename.includes('profile')) return 'Original'

      return 'Style'
    },
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
}

.image-card:hover {
  transform: scale(1.05);
}
</style>
