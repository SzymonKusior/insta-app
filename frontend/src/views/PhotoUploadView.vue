<template>
  <div class="upload-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">
          <v-card class="pa-4 mb-6" elevation="2">
            <v-card-title class="text-center text-h4 py-4"> Upload Photo </v-card-title>

            <v-card-text>
              <PhotoUpload />
            </v-card-text>
          </v-card>
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
