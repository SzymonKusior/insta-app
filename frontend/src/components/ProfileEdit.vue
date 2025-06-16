<template>
  <div class="profile-edit">
    <h2>Edit Profile</h2>

    <form @submit.prevent="updateProfile">
      <div class="form-group profile-picture-upload">
        <div class="current-avatar">
          <img
            :src="
              previewImage ||
              (user.profilePicture
                ? `http://localhost:3000${user.profilePicture}`
                : '/default-avatar.png')
            "
            alt="Profile picture"
          />
        </div>

        <div class="upload-controls">
          <label for="profile-picture" class="upload-btn">
            <i class="pi pi-camera"></i> Change Profile Picture
          </label>
          <input
            type="file"
            id="profile-picture"
            accept="image/*"
            @change="handleImageChange"
            style="display: none"
          />
          <button v-if="profilePicture" type="button" class="cancel-btn" @click="cancelImageUpload">
            Cancel
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" v-model="formData.username" placeholder="Your username" />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="formData.email" placeholder="Your email" disabled />
        <small>Email cannot be changed</small>
      </div>

      <div class="form-group">
        <label for="bio">Bio</label>
        <textarea
          id="bio"
          v-model="formData.bio"
          placeholder="Tell us about yourself"
          rows="4"
        ></textarea>
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
import { updateUserProfile, uploadProfilePicture } from '@/api'

export default {
  name: 'ProfileEdit',

  props: {
    user: {
      type: Object,
      required: true,
    },
  },

  emits: ['profile-updated'],

  setup(props, { emit }) {
    const formData = reactive({
      username: '',
      email: '',
      bio: '',
    })

    const loading = ref(false)
    const profilePicture = ref(null)
    const previewImage = ref(null)

    onMounted(() => {
      // Initialize form with user data
      formData.username = props.user.username || ''
      formData.email = props.user.email || ''
      formData.bio = props.user.bio || ''
    })

    const handleImageChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        profilePicture.value = file

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          previewImage.value = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const cancelImageUpload = () => {
      profilePicture.value = null
      previewImage.value = null
    }

    const updateProfile = async () => {
      loading.value = true

      try {
        // First update profile info
        const updatedProfile = await updateUserProfile({
          username: formData.username,
          bio: formData.bio,
        })

        // Then upload profile picture if changed
        if (profilePicture.value) {
          const formData = new FormData()
          formData.append('profilePicture', profilePicture.value)

          const pictureResponse = await uploadProfilePicture(formData)
          updatedProfile.profilePicture = pictureResponse.profilePicture
        }

        // Notify parent of update
        emit('profile-updated', updatedProfile)
      } catch (error) {
        console.error('Error updating profile:', error)
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      loading,
      profilePicture,
      previewImage,
      handleImageChange,
      cancelImageUpload,
      updateProfile,
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #8e8e8e;
  font-size: 12px;
}

.profile-picture-upload {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.current-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.current-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background-color: #0095f6;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.cancel-btn {
  padding: 10px 20px;
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
