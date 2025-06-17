<!-- frontend/src/components/ProfilePictureUpload.vue -->
<template>
  <div>
    <input type="file" accept="image/*" @change="onFileChange" />
    <div v-if="uploading">Uploading...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { uploadProfilePicture } from '@/api'

const emit = defineEmits(['uploaded'])
const uploading = ref(false)
const error = ref('')

const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await uploadProfilePicture(formData)
    emit('uploaded', response.processedImages) // Pass the processed images
  } catch (err) {
    error.value = err?.message || 'Upload failed'
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
