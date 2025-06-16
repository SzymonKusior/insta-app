<!-- frontend/src/components/ProfilePictureUpload.vue -->
<template>
  <div class="profile-upload">
    <h3>Update Profile Picture</h3>
    <form @submit.prevent="onSubmit">
      <div class="form-group">
        <label for="profile-pic">Select Image</label>
        <input 
          type="file" 
          id="profile-pic" 
          @change="handleFileUpload" 
          accept="image/*" 
        />
      </div>
      
      <div v-if="preview" class="preview">
        <img :src="preview" alt="Preview" />
      </div>
      
      <div v-if="profileStore.getError" class="error-message">
        {{ profileStore.getError }}
      </div>
      
      <button type="submit" :disabled="!file || profileStore.isUploadLoading">
        <template v-if="!profileStore.isUploadLoading">Upload Picture</template>
        <template v-if="profileStore.isUploadLoading">
          Uploading...
          <span class="loader"></span>
        </template>
      </button>
    </form>
    
    <div class="profile-images" v-if="profileStore.getProfile?.profileImages">
      <h4>Your Profile Pictures</h4>
      <div class="image-grid">
        <div class="image-item" v-for="(url, type) in profileStore.getProfile.profileImages" :key="type">
          <img :src="url" :alt="type" />
          <p>{{ formatImageType(type) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useProfileStore } from '@/store';

export default {
  name: 'ProfilePictureUpload',
  
  data() {
    return {
      file: null,
      preview: null
    };
  },
  
  setup() {
    const profileStore = useProfileStore();
    return {
      profileStore
    };
  },
  
  methods: {
    handleFileUpload(e) {
      this.file = e.target.files[0];
      if (this.file) {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.preview = e.target.result;
        };
        reader.readAsDataURL(this.file);
      }
    },
    
    async onSubmit() {
      if (!this.file) return;
      
      const fd = new FormData();
      fd.append('file', this.file);
      
      const result = await this.profileStore.uploadProfileImage(fd);
      if (result && result.success) {
        this.file = null;
        this.preview = null;
      }
    },
    
    formatImageType(type) {
      return type
        .replace('profile-', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }
}
</script>

<style scoped>
.profile-upload {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

button {
  background: #0095f6;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.preview {
  margin: 15px 0;
  text-align: center;
}

.preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 100%;
  object-fit: cover;
}

.error-message {
  color: red;
  margin: 10px 0;
}

.loader {
  width: 15px;
  height: 15px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  margin-left: 10px;
  animation: spin 1s linear infinite;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.image-item {
  text-align: center;
}

.image-item img {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.image-item p {
  margin-top: 5px;
  font-size: 0.9em;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>