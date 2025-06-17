<!-- frontend/src/components/PhotoFeed.vue -->
<template>
  <div class="photo-feed">
    <!-- Tag filtering section -->
    <div class="tag-filter">
      <h3>Filter by tags:</h3>
      <div v-if="tagsLoading" class="loading-tags">Loading tags...</div>
      <div v-else class="tags-container">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="tag-chip"
          :class="{ selected: selectedTags.includes(tag.id) }"
          @click="toggleTag(tag.id)"
        >
          {{ tag.name }} ({{ tag.popularity }})
        </div>
      </div>
      <button v-if="selectedTags.length > 0" @click="clearTagFilters" class="clear-filters">
        Clear filters
      </button>
    </div>

    <div v-if="photoStore.isLoading" class="loading">Loading photos...</div>

    <div v-else-if="!photoStore.getPhotos.length" class="no-photos">
      No photos available. <router-link to="/upload">Upload some!</router-link>
    </div>

    <div v-else-if="filteredPhotos.length === 0 && selectedTags.length > 0" class="no-photos">
      No photos match the selected tags.
    </div>

    <div v-else class="photo-grid">
      <div v-for="photo in filteredPhotos" :key="photo.id" class="photo-card">
        <img :src="getPhotoUrl(photo)" :alt="photo.originalName" />

        <div class="photo-info">
          <h3>{{ photo.originalName }}</h3>
          <p>Album: {{ photo.album }}</p>

          <div v-if="photo.tags && photo.tags.length" class="tags">
            <span v-for="tag in photo.tags" :key="tag.id" class="tag">
              {{ tag.name }}
            </span>
          </div>

          <!-- <button @click="deletePhoto(photo.id)" class="delete-btn">
            <template v-if="!deletingPhoto">Delete</template>
            <template v-else>
              Deleting...
              <span class="loader"></span>
            </template>
          </button> -->
        </div>
      </div>
    </div>
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
      getPhotoUrl, // <-- add this
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
  padding: 20px;
}

.loading,
.no-photos,
.loading-tags {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  color: #555;
}

.loading-tags {
  padding: 10px;
  font-size: 1em;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.photo-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.photo-card img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.photo-info {
  padding: 15px;
}

.photo-info h3 {
  margin: 0 0 10px;
  font-size: 1.2em;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 10px 0;
}

.tag {
  background: #f0f0f0;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
}

.tag:hover {
  background: #e0e0e0;
}

.delete-btn {
  background: #ff3b30;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  margin-left: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Tag filtering styles */
.tag-filter {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tag-filter h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #262626;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.tag-chip {
  background-color: #f0f0f0;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.tag-chip:hover {
  background-color: #e0e0e0;
}

.tag-chip.selected {
  background-color: #0095f6;
  color: white;
}

.clear-filters {
  background-color: #ff3b30;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.clear-filters:hover {
  background-color: #e62e29;
}
</style>
