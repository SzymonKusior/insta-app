<template>
  <div class="upload-view">
    <PhotoUpload />
  </div>
</template>

<script>
import PhotoUpload from '../components/PhotoUpload.vue'

export default {
  name: 'PhotoUploadView',
  components: {
    PhotoUpload,
  },
}
</script>

<style scoped>
.upload-view h1 {
  text-align: center;
  margin-bottom: 30px;
}
</style>
