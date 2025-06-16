<template>
  <div class="home-view">
    <h1>Photo Feed</h1>
    <PhotoFeed />
  </div>
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
.home-view h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #262626;
}
</style>
