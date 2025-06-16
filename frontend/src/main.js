// frontend/src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import pinia from '@/store'
import router from './router'
import PrimeVue from 'primevue/config'

// Import PrimeVue
import Aura from '@primeuix/themes/aura'
import { Ripple } from 'primevue'
// Uncomment if you want to use PrimeVue styling
// import 'primevue/resources/themes/lara-light-blue/theme.css'
// import 'primevue/resources/primevue.min.css'
// import 'primeicons/primeicons.css'

// Create and mount app
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    ripple: true,
  },
})
app.mount('#app')
