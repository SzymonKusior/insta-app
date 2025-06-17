<!-- frontend/src/components/PhotoFeed.vue -->
<template>
  <div class="photo-feed">
    <!-- Tag filtering section -->
    <v-sheet class="mb-6 pa-4 rounded" elevation="1">
      <h3 class="text-h6 mb-3">Filter by tags:</h3>

      <v-progress-circular
        v-if="tagsLoading"
        indeterminate
        color="primary"
        class="mx-auto d-block my-2"
      ></v-progress-circular>

      <div v-else>
        <v-chip-group>
          <v-chip
            v-for="tag in tags"
            :key="tag.id"
            :variant="selectedTags.includes(tag.id) ? 'flat' : 'outlined'"
            :class="selectedTags.includes(tag.id) ? 'text-white' : ''"
            @click="toggleTag(tag.id)"
            class="ma-1"
          >
            {{ tag.name }} ({{ tag.popularity }})
          </v-chip>
        </v-chip-group>

        <v-btn
          v-if="selectedTags.length > 0"
          @click="clearTagFilters"
          color="error"
          variant="tonal"
          size="small"
          class="mt-3"
          prepend-icon="mdi-filter-remove"
        >
          Clear filters
        </v-btn>
      </div>
    </v-sheet>

    <v-progress-circular
      v-if="photoStore.isLoading"
      indeterminate
      color="primary"
      class="mx-auto d-block my-8"
    ></v-progress-circular>

    <v-sheet
      v-else-if="!photoStore.getPhotos.length"
      class="pa-8 rounded text-center"
      color="grey-lighten-4"
    >
      <v-icon icon="mdi-image-off" size="large" color="grey" class="mb-4"></v-icon>
      <p class="text-body-1 mb-4">No photos available.</p>
      <v-btn to="/upload" color="primary" prepend-icon="mdi-upload"> Upload Some Photos </v-btn>
    </v-sheet>

    <v-sheet
      v-else-if="filteredPhotos.length === 0 && selectedTags.length > 0"
      class="pa-8 rounded text-center"
      color="grey-lighten-4"
    >
      <v-icon icon="mdi-tag-off" size="large" color="grey" class="mb-4"></v-icon>
      <p class="text-body-1 mb-4">No photos match the selected tags.</p>
      <v-btn @click="clearTagFilters" color="primary" variant="tonal"> Clear Tag Filters </v-btn>
    </v-sheet>

    <v-row v-else>
      <v-col v-for="photo in filteredPhotos" :key="photo.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="photo-card" elevation="2">
          <v-img :src="getPhotoUrl(photo)" :alt="photo.originalName" height="250" cover></v-img>

          <v-card-title class="text-subtitle-1 text-truncate">
            {{ photo.originalName }}
          </v-card-title>

          <v-card-subtitle> user: {{ photo.album }} </v-card-subtitle>

          <v-card-text v-if="photo.tags && photo.tags.length">
            <v-chip
              v-for="tag in photo.tags"
              :key="tag.id"
              size="small"
              class="ma-1"
              color="primary-lighten-4"
              variant="outlined"
            >
              {{ tag.name }}
            </v-chip>
          </v-card-text>

          <!-- Uncomment if you want to enable delete functionality
          <v-card-actions>
            <v-btn
              @click="deletePhoto(photo.id)"
              color="error"
              variant="tonal"
              block
              prepend-icon="mdi-delete"
              :loading="deletingPhoto"
            >
              Delete
            </v-btn>
          </v-card-actions>
          -->
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { usePhotoStore } from '@/store'
import { ref, computed, onMounted } from 'vue'
import { getPhotoUrl } from '@/api'

export default {
  name: 'PhotoFeed',

  setup() {
    const photoStore = usePhotoStore()
    const deletingPhoto = ref(false)
    const tags = ref([])
    const tagsLoading = ref(true)
    const selectedTags = ref([])

    // Computed property to filter photos by selected tags
    const filteredPhotos = computed(() => {
      console.log('Computing filtered photos with selected tags:', selectedTags.value)

      if (selectedTags.value.length === 0) {
        return photoStore.getPhotos
      }

      // Get the tag objects for the selected tag IDs
      const selectedTagObjects = selectedTags.value
        .map((tagId) => tags.value.find((tag) => Number(tag.id) === Number(tagId)))
        .filter((tag) => tag !== undefined)

      console.log('Selected tag objects:', selectedTagObjects)

      return photoStore.getPhotos.filter((photo) => {
        if (!photo.tags || photo.tags.length === 0) {
          return false
        }

        // Log the photo and its tags for debugging
        console.log(`Checking photo ${photo.id} tags:`, photo.tags)

        // Check if any of the photo's tags match any of the selected tags
        const hasMatchingTag = photo.tags.some((photoTag) => {
          return selectedTagObjects.some((selectedTag) => {
            // If photo tag has an id property, compare to id
            if (photoTag.id !== undefined) {
              return Number(photoTag.id) === Number(selectedTag.id)
            }

            // If photo tag only has a name property, compare to name
            if (photoTag.name !== undefined && selectedTag.name !== undefined) {
              const photoTagName = photoTag.name.toLowerCase()
              const selectedTagName = selectedTag.name.toLowerCase()

              console.log(`Comparing tag names: "${photoTagName}" vs "${selectedTagName}"`)
              return photoTagName === selectedTagName
            }

            return false
          })
        })

        console.log(`Photo ${photo.id} has matching tag:`, hasMatchingTag)
        return hasMatchingTag
      })
    })

    // Function to toggle tag selection
    const toggleTag = (tagId) => {
      console.log('Toggling tag:', tagId, 'Type:', typeof tagId)

      // Check if the tag is already selected
      const index = selectedTags.value.findIndex((id) => Number(id) === Number(tagId))

      if (index !== -1) {
        // Tag is already selected, remove it
        console.log('Removing tag from selection')
        selectedTags.value.splice(index, 1)
      } else {
        // Tag is not selected, add it
        console.log('Adding tag to selection')
        // Create a new array to ensure reactivity
        selectedTags.value = [...selectedTags.value, Number(tagId)]
      }

      console.log('Selected tags after toggle:', selectedTags.value)
    }

    // Function to select a single tag
    const selectSingleTag = (tagId) => {
      console.log('Selecting single tag:', tagId, 'Type:', typeof tagId)
      // Create a new array with the selected tag ID to ensure reactivity
      selectedTags.value = [Number(tagId)]
      console.log('Selected tags after selection:', selectedTags.value)
      // Scroll to the top to see the filtered results
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Function to clear all tag filters
    const clearTagFilters = () => {
      selectedTags.value = []
    }

    // Fetch tags from the API
    const fetchTags = async () => {
      tagsLoading.value = true
      try {
        const response = await fetch('http://localhost:3000/api/tags')
        const data = await response.json()
        console.log('Fetched tags:', data)
        tags.value = data.sort((a, b) => b.popularity - a.popularity)
      } catch (error) {
        console.error('Error fetching tags:', error)
        tags.value = []
      } finally {
        tagsLoading.value = false
      }
    }

    onMounted(() => {
      fetchTags()
    })

    return {
      photoStore,
      deletingPhoto,
      tags,
      tagsLoading,
      selectedTags,
      filteredPhotos,
      toggleTag,
      selectSingleTag,
      clearTagFilters,
      getPhotoUrl,
    }
  },

  mounted() {
    this.photoStore.fetchPhotos()
  },

  methods: {
    async deletePhoto(id) {
      if (confirm('Are you sure you want to delete this photo?')) {
        this.deletingPhoto = true
        await this.photoStore.removePhoto(id)
        this.deletingPhoto = false
      }
    },
  },
}
</script>

<style scoped>
.photo-feed {
  max-width: 1200px;
  margin: 0 auto;
}

.photo-card {
  transition: transform 0.2s;
  height: 100%;
}

.photo-card:hover {
  transform: translateY(-5px);
}
</style>
