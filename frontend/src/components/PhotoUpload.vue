<!-- frontend/src/components/PhotoUpload.vue -->
<template>
  <div class="upload-container">
    <v-card class="pa-4 mb-6" elevation="2">
      <v-card-title class="text-center text-h5 pb-4">Upload Photo</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleUpload">
          <v-file-input
            accept="image/*"
            label="Select Photo"
            variant="outlined"
            @change="handleFileChange"
            prepend-icon="mdi-file-image"
            required
            :disabled="uploading"
          ></v-file-input>

          <v-img
            v-if="preview"
            :src="preview"
            alt="Preview"
            class="my-4 rounded"
            max-height="300"
            contain
          ></v-img>

          <!-- Album field is now hidden -->
          <input type="hidden" v-model="album" />

          <v-text-field
            v-model="tags"
            label="Tags (Separate with commas)"
            variant="outlined"
            prepend-icon="mdi-tag-multiple"
            placeholder="e.g. #nature, #sunset, #beach"
            hint="Add # prefix for better tag organization"
            persistent-hint
            class="mt-4"
          ></v-text-field>

          <v-select
            v-model="selectedFilter"
            :items="availableFilters"
            item-title="label"
            item-value="key"
            label="Select Filter"
            variant="outlined"
            prepend-icon="mdi-filter"
            return-object
            class="mt-4"
          ></v-select>

          <v-btn
            type="submit"
            color="primary"
            block
            :loading="uploading"
            :disabled="!file"
            class="mt-6"
            prepend-icon="mdi-upload"
          >
            {{ uploading ? 'Uploading...' : 'Upload Photo' }}
          </v-btn>
        </v-form>

        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          {{ error }}
        </v-alert>

        <v-progress-circular
          v-if="authStore.loading"
          indeterminate
          color="primary"
          class="d-block mx-auto my-6"
        ></v-progress-circular>

        <v-alert v-else-if="!authStore.user" type="warning" variant="tonal" class="mt-4">
          Unable to load user data. Please try
          <a @click.prevent="reloadAuth" class="text-primary text-decoration-underline"
            >refreshing</a
          >
          or
          <router-link to="/login" class="text-primary text-decoration-underline"
            >login again</router-link
          >.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Filter previews section -->
    <v-sheet
      v-if="filterPreviews.length"
      class="filter-previews-container mt-4 pa-4"
      rounded
      elevation="1"
    >
      <h3 class="text-h6 mb-4">Filter Previews</h3>

      <v-row>
        <v-col v-for="filter in filterPreviews" :key="filter.key" cols="6" sm="4" md="3">
          <v-card
            class="filter-preview"
            :elevation="selectedFilter.key === filter.key ? 6 : 2"
            :class="{ 'border-primary': selectedFilter.key === filter.key }"
            @click="selectedFilter = availableFilters.find((f) => f.key === filter.key)"
          >
            <v-img :src="filter.src" :alt="filter.label" height="150" cover></v-img>

            <v-card-text class="text-center pa-2">
              {{ filter.label }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
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
      { key: 'tint', label: 'Tint' },
    ]
    const selectedFilter = ref(availableFilters[0])
    const filterPreviews = ref([])
    const uploadedImageId = ref(null)

    const handleFileChange = async (event) => {
      const selectedFile = event.target.files[0]
      if (!selectedFile) return

      file.value = selectedFile

      // Create preview URL
      preview.value = URL.createObjectURL(selectedFile)

      // Upload the file to your backend and get imageId
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('album', album.value)

      try {
        const response = await fetch('http://localhost:3000/api/photos', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        uploadedImageId.value = data.id

        // Generate filter previews
        await generateFilterPreviews(uploadedImageId.value)
      } catch (err) {
        error.value = 'Failed to upload image for preview. Please try again.'
        console.error('Error uploading for preview:', err)
      }
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

        try {
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
        } catch (err) {
          console.error(`Error generating preview for ${filter.key}:`, err)
        }
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
            lastChange: selectedFilter.value.key,
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
        console.error('Upload error:', err)
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
  max-width: 800px;
  margin: 0 auto;
}

.filter-previews-container {
  background-color: white;
}

.filter-preview {
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  height: 100%;
}

.filter-preview:hover {
  transform: scale(1.03);
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
