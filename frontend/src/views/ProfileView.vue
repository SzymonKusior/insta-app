<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-avatar">
        <img
          :src="
            user.profilePicture
              ? `http://localhost:3000${user.profilePicture}`
              : '/default-avatar.png'
          "
          alt="Profile picture"
        />
      </div>

      <div class="profile-info">
        <h1>{{ user.username }}</h1>
        <p>{{ user.bio || 'No bio provided' }}</p>
        <p class="join-date">Joined: {{ formatDate(user.createdAt) }}</p>

        <div class="profile-actions">
          <button
            class="view-toggle-btn"
            :class="{ active: currentView === 'photos' }"
            @click="currentView = 'photos'"
          >
            <i class="pi pi-images"></i> My Photos
          </button>
          <button
            class="view-toggle-btn"
            :class="{ active: currentView === 'edit' }"
            @click="currentView = 'edit'"
          >
            <i class="pi pi-user-edit"></i> Edit Profile
          </button>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <!-- Photos View - removed the userEmail prop -->
      <ProfilePhotos v-if="currentView === 'photos'" />

      <!-- Edit Profile View - remains the same -->
      <ProfileEdit
        v-else-if="currentView === 'edit'"
        :user="user"
        @profile-updated="handleProfileUpdated"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store'
import ProfilePhotos from '@/components/ProfilePhotos.vue'
import ProfileEdit from '@/components/ProfileEdit.vue'

export default {
  name: 'Profile',

  components: {
    ProfilePhotos,
    ProfileEdit,
  },

  setup() {
    const authStore = useAuthStore()
    const currentView = ref('photos') // Default view is photos
    const user = ref({})

    onMounted(async () => {
      // Get user data from auth store
      user.value = authStore.getUser || {}
    })

    const formatDate = (dateString) => {
      if (!dateString) return 'Unknown'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    const handleProfileUpdated = (updatedUser) => {
      user.value = updatedUser
      // Switch to photos view after successful update
      currentView.value = 'photos'
    }

    return {
      currentView,
      user,
      authStore,
      formatDate,
      handleProfileUpdated,
    }
  },
}
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.profile-avatar {
  margin-right: 30px;
}

.profile-avatar img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
}

.profile-info h1 {
  margin: 0 0 10px;
  font-size: 24px;
}

.join-date {
  color: #8e8e8e;
  font-size: 14px;
  margin-top: 10px;
}

.profile-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.view-toggle-btn {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.view-toggle-btn:hover {
  background-color: #e0e0e0;
}

.view-toggle-btn.active {
  background-color: #0095f6;
  color: white;
}

.profile-content {
  margin-top: 20px;
}
</style>
