// frontend/src/store/photos.js
import { defineStore } from 'pinia'
import {
  getAllPhotos,
  getPhoto,
  uploadPhoto,
  deletePhoto,
  addPhotoTags,
  getUserPhotos,
} from '@/api'

const ID = 'photoStore'

const usePhotoStore = defineStore(ID, {
  state: () => ({
    photos: [],
    currentPhoto: null,
    loading: false,
    uploadLoading: false,
    error: null,
  }),

  getters: {
    getPhotos: (state) => state.photos,
    getCurrentPhoto: (state) => state.currentPhoto,
    isLoading: (state) => state.loading,
    isUploadLoading: (state) => state.uploadLoading,
    getError: (state) => state.error,
    // getUsr,
  },

  actions: {
    async fetchPhotos() {
      this.loading = true
      try {
        const data = await getAllPhotos()
        this.photos = data
        this.error = null
      } catch (err) {
        console.log('Fetch photos error:', err)
        this.error = 'Failed to load photos'
      } finally {
        this.loading = false
      }
    },

    async fetchPhotoById(id) {
      this.loading = true
      try {
        const data = await getPhoto(id)
        this.currentPhoto = data
        this.error = null
      } catch (err) {
        console.log('Fetch photo error:', err)
        this.error = 'Failed to load photo'
      } finally {
        this.loading = false
      }
    },

    // This is the implementation that should work for uploadNewPhoto
    async uploadNewPhoto(formData) {
      try {
        console.log('Store: Uploading new photo')
        const photo = await uploadPhoto(formData)
        console.log('Store: Photo uploaded:', photo)

        // Add the new photo to the photos array
        if (photo && this.photos.length > 0) {
          this.photos.unshift(photo)
        }

        this.error = null
        return photo
      } catch (err) {
        console.error('Store: Upload error:', err)
        this.error = 'Failed to upload photo'
        throw err // Re-throw to allow component to handle
      }
    },

    async removePhoto(id) {
      try {
        await deletePhoto(id)
        // Remove photo from list
        this.photos = this.photos.filter((photo) => photo.id !== id)
        this.error = null
      } catch (err) {
        console.log('Delete photo error:', err)
        this.error = 'Failed to delete photo'
      }
    },

    // This is the implementation that should work for addTags
    async addTags(photoId, tags) {
      try {
        console.log('Store: Adding tags to photo', photoId, tags)

        // Make API call to add tags - using the correct format based on your API function
        await addPhotoTags({ photoId, tags })
        console.log('Store: Tags added successfully')

        // Update the photo in the list if it exists
        const photoIndex = this.photos.findIndex((photo) => photo.id === photoId)
        if (photoIndex !== -1) {
          // If the photo has existing tags, merge them, otherwise set new tags
          const existingTags = this.photos[photoIndex].tags || []
          this.photos[photoIndex].tags = [...existingTags, ...tags]
        }

        // Update current photo if it matches
        if (this.currentPhoto && this.currentPhoto.id === photoId) {
          const existingTags = this.currentPhoto.tags || []
          this.currentPhoto.tags = [...existingTags, ...tags]
        }

        this.error = null
      } catch (err) {
        console.error('Store: Add tags error:', err)
        this.error = 'Failed to add tags'
        throw err // Re-throw to allow component to handle
      }
    },

    async fetchUserPhotos(userEmail) {
      this.loading = true
      try {
        // Using email instead of ID
        const data = await getUserPhotos(userEmail)
        this.error = null
        return data
      } catch (err) {
        console.log('Fetch user photos error:', err)
        this.error = 'Failed to load user photos'
        return []
      } finally {
        this.loading = false
      }
    },
  },
})

export default usePhotoStore
