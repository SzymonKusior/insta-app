<!-- frontend/src/components/PhotoUpload.vue -->
<template>
  <div class="upload-container">
    <h1>Upload Photo</h1>

    <form @submit.prevent="handleUpload" class="upload-form">
      <div class="form-group">
        <label for="file">Select Photo</label>
        <input type="file" id="file" @change="handleFileChange" accept="image/*" required />
        <div v-if="preview" class="image-preview">
          <img :src="preview" alt="Preview" />
        </div>
      </div>

      <!-- Album field is now hidden -->
      <input type="hidden" v-model="album" />

      <div class="form-group">
        <label for="tags">Tags (Separate with commas)</label>
        <input type="text" id="tags" v-model="tags" placeholder="e.g. #nature, #sunset, #beach" />
        <small class="helper-text">Add # prefix for better tag organization</small>
      </div>

      <div class="form-group">
        <label for="filter">Select Filter</label>
        <select id="filter" v-model="selectedFilter">
          <option v-for="filter in availableFilters" :key="filter.key" :value="filter.key">
            {{ filter.label }}
          </option>
        </select>
      </div>

      <button type="submit" class="upload-button" :disabled="!file">
        <span v-if="uploading">Uploading...</span>
        <span v-else>Upload Photo</span>
      </button>
    </form>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="authStore.loading" class="loading">Loading user data...</div>

    <div v-else-if="!authStore.user" class="auth-error">
      Unable to load user data. Please try <a @click="reloadAuth" href="#">refreshing</a> or
      <router-link to="/login">login again</router-link>.
    </div>

    <div v-else>
      <!-- Filter previews section -->
      <div v-if="filterPreviews.length" class="filter-previews">
        <div
          v-for="filter in filterPreviews"
          :key="filter.key"
          class="filter-preview"
          :class="{ selected: selectedFilter === filter.key }"
          @click="selectedFilter = filter.key"
        >
          <img :src="filter.src" :alt="filter.label" />
          <div class="filter-label">{{ filter.label }}</div>
        </div>
      </div>

      <!-- Rest of your form -->
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { usePhotoStore, useAuthStore } from '@/store'
import { useRouter } from 'vue-router'
import { createTag } from '@/api' // Import the createTag function

export default {
  name: 'Upload',

  setup() {
    const photoStore = usePhotoStore()
    const authStore = useAuthStore()
    const router = useRouter()

    const file = ref(null)
    const preview = ref(null)
    const tags = ref('')
    const uploading = ref(false)
    const error = ref(null)

    // Redirect to login if not authenticated
    onMounted(async () => {
      await authStore.checkAuthStatus()

      if (!authStore.isAuthenticated) {
        router.push('/login')
      }
    })

    // Album is user's email, or empty string if not loaded yet
    const album = computed(() => {
      console.log('czy bedzie email?', authStore)

      return authStore.user?.email || 'bruh'
    })

    const availableFilters = [
      { key: 'original', label: 'Original' },
      { key: 'grayscale', label: 'Grayscale' },
      { key: 'flip', label: 'Flip' },
      { key: 'flop', label: 'Flop' },
      // { key: 'rotate', label: 'Rotate' },
      { key: 'tint', label: 'Tint' },
      // Add more as needed
    ]
    const selectedFilter = ref('original')
    const filterPreviews = ref([])
    const uploadedImageId = ref(null)

    const handleFileChange = async (event) => {
      const selectedFile = event.target.files[0]
      if (!selectedFile) return

      file.value = selectedFile // <-- Add this line

      // Upload the file to your backend and get imageId
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('album', album.value)
      const response = await fetch('http://localhost:3000/api/photos', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      uploadedImageId.value = data.id

      // Generate filter previews
      await generateFilterPreviews(uploadedImageId.value)
    }

    const generateFilterPreviews = async (imageId) => {
      filterPreviews.value = []

      // Always add original
      filterPreviews.value.push({
        key: 'original',
        label: 'Original',
        src: `http://localhost:3000/api/getImage/${imageId}`,
      })

      // For each filter, PATCH and then GET the preview
      for (const filter of availableFilters) {
        if (filter.key === 'original') continue

        // 1. PATCH to apply filter
        await fetch('http://localhost:3000/api/filters/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: imageId,
            lastChange: filter.key,
            params: {},
          }),
        })

        // 2. GET the filtered image
        filterPreviews.value.push({
          key: filter.key,
          label: filter.label,
          src: `http://localhost:3000/api/getImage/${imageId}/filter/${filter.key}`,
        })
      }
    }

    const handleUpload = async () => {
      if (!file.value) return

      uploading.value = true
      error.value = null

      try {
        // 1. Delete the previous (temporary) photo if it exists
        if (uploadedImageId.value) {
          await fetch(`http://localhost:3000/api/photos/${uploadedImageId.value}`, {
            method: 'DELETE',
          })
        }

        // 2. Upload the original file again, including tags
        const formData = new FormData()
        formData.append('file', file.value)
        formData.append('album', album.value)

        const uploadResponse = await fetch('http://localhost:3000/api/photos', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadResponse.json()
        const newImageId = uploadData.id

        if (tags.value && newImageId) {
          // Parse tags and format them as objects with name property
          const tagsList = tags.value
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .map((tag) => {
              // Ensure tag has # prefix
              const tagName = tag.startsWith('#') ? tag : `#${tag}`
              return { name: tagName }
            })

          if (tagsList.length > 0) {
            console.log('Adding tags:', tagsList)

            // Create new tags on the server before adding them to the photo
            const createTagPromises = tagsList.map(async (tag) => {
              try {
                // Attempt to create the tag - if it already exists, the server will return an error
                // but we can safely ignore it
                await createTag(tag.name)
                console.log(`Created tag: ${tag.name}`)
              } catch (err) {
                // Tag likely already exists, which is fine
                console.log(`Tag ${tag.name} may already exist:`, err)
              }
              return tag
            })

            // Wait for all tag creation attempts to complete
            const processedTags = await Promise.all(createTagPromises)
            try {
              // Now add the tags to the photo
              await photoStore.addTags(newImageId, processedTags)
              console.log('Tags added successfully')
            } catch (tagError) {
              console.error('Error adding tags:', tagError)
              // Continue with the upload process even if tag addition fails
            }
          }
        }

        // 3. PATCH the uploaded image with the selected filter
        await fetch('http://localhost:3000/api/filters/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newImageId,
            lastChange: selectedFilter.value,
            params: {},
          }),
        })

        // Reset form or redirect
        file.value = null
        preview.value = null
        tags.value = ''
        router.push('/')
      } catch (err) {
        error.value = 'Failed to upload and apply filter. Please try again.'
      } finally {
        uploading.value = false
      }
    }

    // Function to manually reload auth state
    const reloadAuth = async () => {
      await authStore.initAuth()

      // If still not authenticated after reload, redirect to login
      if (!authStore.isAuthenticated || !authStore.user) {
        router.push('/login')
      }
    }

    return {
      file,
      preview,
      album,
      tags,
      uploading,
      error,
      handleFileChange,
      handleUpload,
      authStore,
      reloadAuth,
      availableFilters,
      selectedFilter,
      filterPreviews,
    }
  },
}
</script>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  text-align: center;
}

.upload-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.helper-text {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.8rem;
}

.form-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f8ff;
  border: 1px solid #cce5ff;
  border-radius: 4px;
  color: #0066cc;
}

.image-preview {
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  max-height: 300px;
}

.image-preview img {
  width: 100%;
  height: auto;
}

.upload-button {
  width: 100%;
  padding: 12px;
  background-color: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.upload-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 20px;
  padding: 10px;
  background-color: #ffdddd;
  border: 1px solid #ff8888;
  border-radius: 4px;
  color: #cc0000;
}

.loading,
.auth-error {
  text-align: center;
  padding: 2rem;
  margin: 1rem 0;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.auth-error {
  color: #d32f2f;
}

.user-info {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.filter-previews {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.filter-preview {
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.3s;
}

.filter-preview.selected {
  border-color: #0095f6;
}

.filter-preview img {
  display: block;
  width: 100%;
  height: auto;
}

.filter-label {
  text-align: center;
  padding: 5px 0;
  font-size: 0.9rem;
  color: #333;
}
</style>
