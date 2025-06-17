<template>
  <div class="profile-picture-selector">
    <div v-if="loading">Loading images...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div class="versions-grid" v-if="images.length">
      <div
        v-for="(img, idx) in images"
        :key="img"
        class="version-option"
        :class="{ selected: selectedIdx === idx }"
        @click="selectedIdx = idx"
      >
        <img :src="`http://localhost:3000${img}`" />
      </div>
    </div>
    <button :disabled="selectedIdx === null" @click="setProfilePictureHandler" class="confirm-btn">
      Set as Profile Picture
    </button>
  </div>
</template>

<script>
import { getProfileImages, setProfilePicture } from '@/api'

export default {
  name: 'ProfilePictureSelector',
  emits: ['selected'],
  data() {
    return {
      images: [],
      selectedIdx: null,
      loading: false,
      error: '',
    }
  },
  methods: {
    async fetchImages() {
      this.loading = true
      this.error = ''
      try {
        const res = await getProfileImages()
        // Sort images to put most recently added first (assuming file naming convention)
        const sortedImages = this.sortImagesByRecent(res.images || [])
        this.images = sortedImages

        // Select the first image by default (most recent)
        if (this.images.length > 0) {
          this.selectedIdx = 0
        } else {
          this.selectedIdx = null
        }
      } catch (err) {
        this.error = err?.message || 'Failed to load images'
        console.error('[ProfilePictureSelector] Error fetching images:', err)
      } finally {
        this.loading = false
      }
    },

    // Helper method to sort images by recency
    sortImagesByRecent(images) {
      // This is a simple heuristic that assumes the most recently processed images
      // have the word "profile" without other descriptive terms
      return [...images].sort((a, b) => {
        // Put profile.png first (assuming it's the most recent)
        if (a.includes('profile.png')) return -1
        if (b.includes('profile.png')) return 1
        return 0
      })
    },

    async setProfilePictureHandler() {
      if (this.selectedIdx === null) return
      const selectedUrl = this.images[this.selectedIdx]
      try {
        await setProfilePicture({ profilePicture: selectedUrl })
        this.$emit('selected', selectedUrl)
      } catch (err) {
        this.error = err?.message || 'Failed to set profile picture'
        console.error('[ProfilePictureSelector] Error setting picture:', err)
      }
    },
  },
  mounted() {
    this.fetchImages()
  },
}
</script>

<style scoped>
.profile-picture-selector {
  margin-bottom: 20px;
}

.versions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
}

.version-option {
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s;
}

.version-option:hover {
  transform: scale(1.05);
}

.version-option.selected {
  border-color: #0095f6;
}

.version-option img {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

.confirm-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: red;
  margin: 10px 0;
}
</style>
