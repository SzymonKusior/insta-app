<template>
  <div class="upload-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">
          <PhotoUpload />
        </v-col>
      </v-row>
    </v-container>
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
.upload-view {
  padding-top: 2rem;
}
</style>
