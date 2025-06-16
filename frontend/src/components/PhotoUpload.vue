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

      <div class="form-info">
        <p>
          Photo will be uploaded to your personal album: <strong>{{ album }}</strong>
        </p>
      </div>

      <button type="submit" class="upload-button" :disabled="!file || uploading">
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
      <!-- Your existing upload form -->
      <h2>Upload a New Photo</h2>
      <p v-if="authStore.userEmail" class="user-info">Uploading as: {{ authStore.userEmail }}</p>

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
    onMounted(() => {
      console.log(authStore.isAuthenticated)

      if (!authStore.isAuthenticated) {
        router.push('/login')
      }
    })

    // Album is user's email, or empty string if not loaded yet
    const album = computed(() => {
      return authStore.user?.email || 'bruh'
    })

    const handleFileChange = (event) => {
      const selectedFile = event.target.files[0]

      if (selectedFile) {
        file.value = selectedFile

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          preview.value = e.target.result
        }
        reader.readAsDataURL(selectedFile)
      }
    }

    const handleUpload = async () => {
      if (!file.value) return

      uploading.value = true
      error.value = null

      try {
        console.log('Starting upload process')
        const formData = new FormData()
        formData.append('file', file.value)
        formData.append('album', album.value)
        console.log('Using album name:', album.value)

        // Upload the photo
        console.log('Uploading photo...')
        const photo = await photoStore.uploadNewPhoto(formData)
        console.log('Photo uploaded successfully:', photo)

        // Add tags if provided
        if (tags.value && photo?.id) {
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
              await photoStore.addTags(photo.id, processedTags)
              console.log('Tags added successfully')
            } catch (tagError) {
              console.error('Error adding tags:', tagError)
              // Continue with the upload process even if tag addition fails
            }
          }
        }

        // Reset form
        file.value = null
        preview.value = null
        tags.value = ''

        console.log('Upload completed, navigating to home page')
        // Navigate to home page after successful upload
        router.push('/')
      } catch (err) {
        console.error('Upload error:', err)
        error.value = 'Failed to upload photo. Please try again.'
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
</style>
