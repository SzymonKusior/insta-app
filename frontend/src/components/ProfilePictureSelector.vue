<template>
  <div class="profile-picture-selector">
    <h3>Select Your Profile Picture</h3>
    <div class="versions-grid">
      <div
        v-for="version in versions"
        :key="version.version"
        class="version-option"
        :class="{ selected: selectedVersion === version.version }"
        @click="selectVersion(version.version)"
      >
        <img :src="`http://localhost:3000${version.url}`" :alt="version.version" />
        <p>{{ formatVersionName(version.version) }}</p>
      </div>
    </div>
    <div class="actions">
      <button @click="confirmSelection" :disabled="!selectedVersion" class="confirm-btn">
        Confirm Selection
      </button>
      <button @click="$emit('cancel')" class="cancel-btn">Cancel</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'ProfilePictureSelector',
  emits: ['selected', 'cancel'],
  setup(props, { emit }) {
    const versions = ref([])
    const selectedVersion = ref(null)

    const loadVersions = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/profile/versions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          versions.value = data.versions
        }
      } catch (error) {
        console.error('Error loading profile versions:', error)
      }
    }

    const selectVersion = (version) => {
      selectedVersion.value = version
    }

    const confirmSelection = async () => {
      if (!selectedVersion.value) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/profile/select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            version: selectedVersion.value,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          emit('selected', data.profilePicture)
        }
      } catch (error) {
        console.error('Error selecting profile picture:', error)
      }
    }

    const formatVersionName = (version) => {
      return version.charAt(0).toUpperCase() + version.slice(1)
    }

    onMounted(() => {
      loadVersions()
    })

    return {
      versions,
      selectedVersion,
      selectVersion,
      confirmSelection,
      formatVersionName,
    }
  },
}
</script>

<style scoped>
.profile-picture-selector {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.versions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.version-option {
  text-align: center;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.version-option:hover {
  border-color: #ddd;
}

.version-option.selected {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.version-option img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
}

.version-option p {
  margin: 10px 0 0 0;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.confirm-btn,
.cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.confirm-btn {
  background-color: #007bff;
  color: white;
}

.confirm-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}
</style>
