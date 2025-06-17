<template>
  <div class="profile-edit">
    <v-sheet class="pa-4">
      <h2 class="text-h5 mb-6">Edit Profile</h2>

      <v-form @submit.prevent="updateProfile">
        <v-row>
          <v-col cols="12">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Profile Picture</h3>
            <div class="d-flex align-center gap-4 mb-3">
              <v-avatar size="100" class="profile-avatar">
                <v-img
                  :src="
                    user.profilePicture
                      ? `http://localhost:3000${user.profilePicture}`
                      : '/default-avatar.png'
                  "
                  alt="Profile Picture"
                  cover
                ></v-img>
              </v-avatar>
              <v-btn color="primary" variant="outlined" @click="startProfilePictureChange">
                Change Picture
              </v-btn>
            </div>

            <!-- Profile picture management section -->
            <v-expand-transition>
              <v-sheet
                v-if="showPictureManagement"
                class="mt-4 pa-4 rounded"
                color="grey-lighten-4"
              >
                <v-progress-circular
                  v-if="pictureCheckLoading"
                  indeterminate
                  color="primary"
                  class="mx-auto d-block mb-4"
                ></v-progress-circular>

                <div v-else>
                  <!-- Selector section - always shows if images exist -->
                  <div v-if="hasExistingImages || uploadedImages.length > 0" class="mb-4">
                    <h4 class="text-subtitle-2 font-weight-bold mb-3">
                      Select your profile picture
                    </h4>
                    <ProfilePictureSelector
                      ref="selector"
                      @selected="onProfilePicSelected"
                      :refresh-trigger="selectorRefreshTrigger"
                      :new-images="uploadedImages"
                    />
                  </div>

                  <!-- Always show upload option regardless of whether images exist -->
                  <div class="mb-4 mt-4">
                    <v-divider
                      v-if="hasExistingImages || uploadedImages.length > 0"
                      class="mb-4"
                    ></v-divider>

                    <h4 class="text-subtitle-2 font-weight-bold mb-3">
                      {{
                        hasExistingImages || uploadedImages.length > 0
                          ? 'Upload a new profile picture'
                          : 'Upload your first profile picture'
                      }}
                    </h4>

                    <v-expand-transition>
                      <div>
                        <ProfilePictureUpload @uploaded="onPictureUploaded" />
                      </div>
                    </v-expand-transition>
                  </div>

                  <v-btn variant="text" color="error" class="mt-3" @click="cancelPictureChange">
                    Cancel
                  </v-btn>
                </div>
              </v-sheet>
            </v-expand-transition>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="formData.name"
              label="Name"
              variant="outlined"
              placeholder="Your name"
              prepend-inner-icon="mdi-account"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="formData.lastName"
              label="Last Name"
              variant="outlined"
              placeholder="Your last name"
              prepend-inner-icon="mdi-account-outline"
            ></v-text-field>
          </v-col>
        </v-row>

        <div class="d-flex justify-end gap-3 mt-6">
          <v-btn color="grey-lighten-2" variant="elevated" @click="$emit('profile-updated', user)">
            Cancel
          </v-btn>
          <v-btn type="submit" color="primary" :loading="loading">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </v-btn>
        </div>
      </v-form>
    </v-sheet>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
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
    const selector = ref(null)
    const showPictureManagement = ref(false)
    const pictureCheckLoading = ref(false)
    const hasExistingImages = ref(false)
    const uploadedImages = ref([])
    const selectorRefreshTrigger = ref(0)

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

    const startProfilePictureChange = async () => {
      showPictureManagement.value = true
      pictureCheckLoading.value = true
      uploadedImages.value = []

      try {
        console.log('[ProfileEdit] Checking for existing profile images...')
        const res = await getProfileImages()
        console.log('[ProfileEdit] Images found:', res.images)

        // Set flag if there are existing images
        hasExistingImages.value = res.images && res.images.length > 0

        // If there are images, initialize the selector
        if (hasExistingImages.value) {
          // Wait for the selector to be mounted before trying to access it
          await nextTick()
          if (selector.value) {
            await selector.value.fetchImages()
          }
        }
      } catch (error) {
        console.error('[ProfileEdit] Error checking profile images:', error)
        hasExistingImages.value = false
      } finally {
        pictureCheckLoading.value = false
      }
    }

    const onPictureUploaded = async (processedImages) => {
      console.log('[ProfileEdit] Image uploaded with processed images:', processedImages)

      // Update uploadedImages with the newly processed images
      uploadedImages.value = processedImages

      // Reset the existing images flag since we're replacing with new ones
      hasExistingImages.value = false

      // Signal the selector to update with the new images
      selectorRefreshTrigger.value++
    }

    const onProfilePicSelected = (url) => {
      console.log('[ProfileEdit] Profile picture selected:', url)

      // Create a copy and emit the updated user
      const updatedUser = { ...props.user, profilePicture: url }
      emit('profile-updated', updatedUser)

      showPictureManagement.value = false
    }

    const cancelPictureChange = () => {
      showPictureManagement.value = false
      uploadedImages.value = []
    }

    return {
      formData,
      loading,
      selector,
      updateProfile,
      onPictureUploaded,
      onProfilePicSelected,
      startProfilePictureChange,
      cancelPictureChange,
      user: props.user,
      showPictureManagement,
      pictureCheckLoading,
      hasExistingImages,
      uploadedImages,
      selectorRefreshTrigger,
    }
  },
}
</script>

<style scoped>
.profile-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.gap-4 {
  gap: 16px;
}

.gap-3 {
  gap: 12px;
}
</style>
