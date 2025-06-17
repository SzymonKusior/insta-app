// frontend/src/store/profile.js
import { defineStore } from 'pinia'
import { getUserProfile, updateUserProfile, uploadProfilePicture } from '@/api'

const ID = 'profileStore'

const useProfileStore = defineStore(ID, {
  state: () => ({
    profile: null,
    loading: false,
    uploadLoading: false,
    error: null,
  }),

  getters: {
    getProfile: (state) => state.profile,
    isLoading: (state) => state.loading,
    isUploadLoading: (state) => state.uploadLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchUserProfile() {
      this.loading = true
      try {
        const data = await getUserProfile()
        this.profile = data.user
        this.error = null
        return data.user
      } catch (err) {
        console.log('Fetch profile error:', err)
        this.error = 'Failed to load profile'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateProfile(profileData) {
      this.loading = true
      try {
        const data = await updateUserProfile(profileData)
        this.profile = data.user
        this.error = null
        return data
      } catch (err) {
        console.log('Update profile error:', err)
        this.error = 'Failed to update profile'
        throw err
      } finally {
        this.loading = false
      }
    },

    async uploadProfileImage(formData) {
      this.uploadLoading = true
      try {
        const data = await uploadProfilePicture(formData)
        console.log('Upload profile image response:', data)

        // If backend returns processedFiles, store and return them
        if (data.success && data.processedFiles) {
          // Update profile with new image info if available
          if (this.profile) {
            this.profile = {
              ...this.profile,
              profileImages: data.processedFiles,
            }
          }
        }

        this.error = null
        return data
      } catch (err) {
        console.log('Upload profile picture error:', err)
        this.error = 'Failed to upload profile picture'
        throw err
      } finally {
        this.uploadLoading = false
      }
    },
  },
})

export default useProfileStore
