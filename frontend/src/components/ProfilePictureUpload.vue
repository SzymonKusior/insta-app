<template>
  <div class="profile-picture-upload">
    <v-file-input
      accept="image/*"
      label="Select Profile Picture"
      variant="outlined"
      @update:model-value="onFileChange"
      prepend-icon="mdi-file-image"
      :disabled="uploading"
      clearable
      :loading="uploading"
      hint="Image will be uploaded automatically when selected"
      persistent-hint
      v-model="selectedFile"
    ></v-file-input>

    <v-progress-linear
      v-if="uploading"
      indeterminate
      color="primary"
      class="mt-2"
    ></v-progress-linear>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
      {{ error }}
    </v-alert>

    <v-alert v-if="success" type="success" variant="tonal" class="mt-4" icon="mdi-check-circle">
      Image uploaded successfully!
    </v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import useProfileStore from '@/store/profile'
import { getProfileImages } from '@/api'

const profileStore = useProfileStore()
const emit = defineEmits(['uploaded'])
const uploading = ref(false)
const error = ref('')
const success = ref(false)
const selectedFile = ref(null)

const onFileChange = async (file) => {
  // Clear previous states
  error.value = ''
  success.value = false

  if (!file) return

  uploading.value = true
  console.log('[ProfilePictureUpload] Auto-uploading file:', file.name)

  const formData = new FormData()
  formData.append('file', file)

  try {
    // Use the store action for uploading
    const response = await profileStore.uploadProfileImage(formData)
    console.log('[ProfilePictureUpload] Upload response:', response)

    // Set success regardless of processed files count
    success.value = true

    // Force a refresh to get the latest images from the server
    try {
      const imagesResponse = await getProfileImages()
      console.log('[ProfilePictureUpload] Fetched updated images:', imagesResponse)

      if (imagesResponse.images && imagesResponse.images.length > 0) {
        // Pass the original image paths without timestamps
        console.log('[ProfilePictureUpload] Emitting clean image paths:', imagesResponse.images)
        emit('uploaded', imagesResponse.images)
      } else {
        console.warn('[ProfilePictureUpload] No images returned from server after upload')
      }
    } catch (fetchErr) {
      console.error('[ProfilePictureUpload] Error fetching updated images:', fetchErr)
      emit('uploaded', [])
    }
  } catch (err) {
    console.error('[ProfilePictureUpload] Upload error:', err)
    error.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

// If you have any mounted logic, use onMounted
onMounted(() => {
  console.log('[ProfilePictureUpload] Component mounted')
})
</script>

<style scoped>
.error {
  color: red;
}
</style>
