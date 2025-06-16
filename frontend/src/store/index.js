// frontend/src/store/index.js
import { createPinia } from 'pinia'

export default createPinia()

import useAuthStore from './auth.js'
import usePhotoStore from './photos.js'
import useProfileStore from './profile.js'

export { useAuthStore, usePhotoStore, useProfileStore }
