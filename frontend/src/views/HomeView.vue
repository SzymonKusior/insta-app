<template>
  <v-container class="home-view">
    <v-row justify="center">
      <v-col cols="12">
        <h1 class="text-h4 text-center font-weight-bold mb-6">Photo Feed</h1>
        <PhotoFeed />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PhotoFeed from '../components/PhotoFeed.vue'

export default {
  name: 'HomeView',
  components: {
    PhotoFeed,
  },
}
</script>

<style scoped>
/* All styling now handled by Vuetify */
</style>
