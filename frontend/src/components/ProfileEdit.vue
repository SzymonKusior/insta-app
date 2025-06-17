<template>
  <div class="profile-edit">
    <h2>Edit Profile</h2>

    <form @submit.prevent="updateProfile">
      <div class="form-group">
        <label>Profile Picture</label>
        <div class="profile-picture-actions">
          <img
            :src="
              user.profilePicture
                ? `http://localhost:3000${user.profilePicture}`
                : '/default-avatar.png'
            "
            class="current-avatar"
            alt="Profile Picture"
          />
          <button type="button" @click="startProfilePictureChange">Change Picture</button>
        </div>

        <!-- Profile picture management section -->
        <div v-if="showPictureManagement" class="picture-management">
          <div v-if="pictureCheckLoading" class="loading">Checking available images...</div>

          <div v-else>
            <!-- Selector section - always shows if images exist -->
            <div v-if="showSelector" class="selector-section">
              <h4>Select your profile picture</h4>
              <ProfilePictureSelector ref="selector" @selected="onProfilePicSelected" />

              <!-- Upload new picture button -->
              <button type="button" class="toggle-btn" @click="toggleUploader">
                {{ showUploader ? 'Hide Uploader' : 'Upload New Picture' }}
              </button>
            </div>

            <!-- Uploader section - toggle visibility -->
            <div v-if="showUploader" class="uploader-section">
              <h4>Upload a new profile picture</h4>
              <ProfilePictureUpload @uploaded="onPictureUploaded" />
            </div>

            <!-- If no images exist, only show uploader -->
            <div v-if="!showSelector && !showUploader">
              <h4>Upload a profile picture</h4>
              <ProfilePictureUpload @uploaded="onPictureUploaded" />
            </div>

            <button type="button" class="cancel-btn" @click="cancelPictureChange">Cancel</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" v-model="formData.name" placeholder="Your name" />
      </div>

      <div class="form-group">
        <label for="lastName">Last Name</label>
        <input type="text" id="lastName" v-model="formData.lastName" placeholder="Your last name" />
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="$emit('profile-updated', user)">
          Cancel
        </button>
        <button type="submit" class="save-btn" :disabled="loading">
          <span v-if="loading">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { updateUserProfile, getProfileImages } from '@/api'
import ProfilePictureUpload from './ProfilePictureUpload.vue'
import ProfilePictureSelector from './ProfilePictureSelector.vue'

export default {
  name: 'ProfileEdit',
  components: {
    ProfilePictureUpload,
    ProfilePictureSelector,
  },
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  emits: ['profile-updated'],
  setup(props, { emit }) {
    const formData = reactive({
      name: '',
      lastName: '',
    })
    const loading = ref(false)
    const showSelector = ref(false)
    const showUploader = ref(false)
    const selector = ref(null)
    const showPictureManagement = ref(false)
    const pictureCheckLoading = ref(false)

    onMounted(() => {
      formData.name = props.user.name || ''
      formData.lastName = props.user.lastName || ''
      console.log('[ProfileEdit] Mounted with user:', props.user)
    })

    const updateProfile = async () => {
      loading.value = true
      console.log('[ProfileEdit] Updating profile with:', formData)
      try {
        const updatedProfile = await updateUserProfile({
          name: formData.name,
          lastName: formData.lastName,
        })

        // Create a copy with updated values
        const updatedUser = {
          ...props.user,
          name: updatedProfile.user.name,
          lastName: updatedProfile.user.lastName,
        }

        emit('profile-updated', updatedUser)
        console.log('[ProfileEdit] Profile updated:', updatedProfile.user)
      } catch (error) {
        console.error('[ProfileEdit] Error updating profile:', error)
      } finally {
        loading.value = false
      }
    }

    const toggleUploader = () => {
      showUploader.value = !showUploader.value
    }

    const startProfilePictureChange = async (e) => {
      e.preventDefault()
      showPictureManagement.value = true
      pictureCheckLoading.value = true

      try {
        console.log('[ProfileEdit] Checking for existing profile images...')
        const res = await getProfileImages()
        console.log('[ProfileEdit] Images found:', res.images)

        if (res.images && res.images.length > 0) {
          // Images exist - show selector, but not uploader by default
          showSelector.value = true
          showUploader.value = false
        } else {
          // No images - show only uploader
          showUploader.value = true
          showSelector.value = false
        }
      } catch (error) {
        console.error('[ProfileEdit] Error checking profile images:', error)
        showUploader.value = true
        showSelector.value = false
      } finally {
        pictureCheckLoading.value = false
      }
    }

    const onPictureUploaded = async (processedImages) => {
      console.log(
        '[ProfileEdit] Image uploaded, showing selector with new images:',
        processedImages,
      )

      // Always show the selector when a new image is uploaded
      showSelector.value = true

      // Wait a short moment to ensure backend processing is complete
      setTimeout(async () => {
        if (selector.value) {
          console.log('[ProfileEdit] Refreshing selector images')
          await selector.value.fetchImages()
        }
      }, 500)
    }

    const onProfilePicSelected = (url) => {
      console.log('[ProfileEdit] Profile picture selected:', url)

      // Create a copy and emit the updated user
      const updatedUser = { ...props.user, profilePicture: url }
      emit('profile-updated', updatedUser)

      showPictureManagement.value = false
      showSelector.value = false
      showUploader.value = false
    }

    const cancelPictureChange = () => {
      showPictureManagement.value = false
      showSelector.value = false
      showUploader.value = false
    }

    return {
      formData,
      loading,
      showSelector,
      showUploader,
      selector,
      updateProfile,
      onPictureUploaded,
      onProfilePicSelected,
      startProfilePictureChange,
      toggleUploader,
      cancelPictureChange,
      user: props.user,
      showPictureManagement,
      pictureCheckLoading,
    }
  },
}
</script>

<style scoped>
.profile-edit {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-edit h2 {
  margin-bottom: 20px;
  font-size: 22px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.profile-picture-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.current-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}

.picture-management {
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.picture-management h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.selector-section,
.uploader-section {
  margin-bottom: 20px;
}

.toggle-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #e9e9e9;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-btn:hover {
  background-color: #ddd;
}

.loading {
  text-align: center;
  padding: 10px;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  padding: 10px 20px;
  background-color: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
