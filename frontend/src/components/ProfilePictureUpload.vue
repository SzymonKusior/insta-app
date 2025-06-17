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
      Image uploaded successfully! {{ processedImages.length }} variants created.
    </v-alert>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import useProfileStore from '@/store/profile'

const profileStore = useProfileStore()
const emit = defineEmits(['uploaded'])
const uploading = ref(false)
const error = ref('')
const success = ref(false)
const processedImages = ref([])
const selectedFile = ref(null)

const onFileChange = async (file) => {
  // Clear previous states
  error.value = ''
  success.value = false
  processedImages.value = []

  // In Vuetify 3, the @update:model-value passes the file directly, not an array
  console.log('Selected file:', file)

  if (!file) return

  uploading.value = true
  console.log('[ProfilePictureUpload] Auto-uploading file:', file.name)

  const formData = new FormData()
  formData.append('file', file)

  try {
    // Use the store action for uploading
    const response = await profileStore.uploadProfileImage(formData)
    console.log('[ProfilePictureUpload] Upload response:', response)

    // The backend should return the processed files
    const processedFiles = response.processedFiles || []

    if (processedFiles.length === 0) {
      console.warn('[ProfilePictureUpload] No processed images returned from server')
    }

    // Store the processed images
    processedImages.value = processedFiles
    success.value = true

    // Emit the processed images to parent component
    emit('uploaded', processedFiles)
  } catch (err) {
    console.error('[ProfilePictureUpload] Upload error:', err)
    error.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.error {
  color: red;
}
</style>
