// frontend/src/api/index.js
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

// Base GET request with error handling
const get = async (url) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        // Add authorization token if available
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.get(url, { headers })
        console.log('axios get response:', response.data)
        resolve(response.data)
      } catch (err) {
        console.error('GET request error:', err)
        reject(err)
      }
    }, 300)
  })
}

// Base POST request with error handling
const post = async (url, object) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        // Add authorization token if available
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.post(url, object, { headers })
        console.log('axios post response:', response.data)
        resolve(response.data)
      } catch (err) {
        console.error('POST request error:', err)
        reject(err)
      }
    }, 300)
  })
}

// Base DELETE request with error handling
const del = async (url) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        // Add authorization token if available
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.delete(url, { headers })
        console.log('axios delete response:', response.data)
        resolve(response.data)
      } catch (err) {
        console.error('DELETE request error:', err)
        reject(err)
      }
    }, 300)
  })
}

// Base PATCH request with error handling
const patch = async (url, object) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        // Add authorization token if available
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.patch(url, object, { headers })
        console.log('axios patch response:', response.data)
        resolve(response.data)
      } catch (err) {
        console.error('PATCH request error:', err)
        reject(err)
      }
    }, 300)
  })
}

// File upload with FormData
const file = async (url, fd) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        // Add authorization token if available
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'multipart/form-data',
        }

        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await axios.post(url, fd, { headers })
        console.log('axios file upload response:', response.data)
        resolve(response.data)
      } catch (err) {
        console.error('File upload error:', err)
        reject(err)
      }
    }, 300)
  })
}

// InstaApp API functions
const loginUser = (credentials) => post(`${API_URL}/user/login`, credentials)
const registerUser = (userData) => post(`${API_URL}/user/register`, userData)
const confirmUserAccount = (token) => get(`${API_URL}/user/confirm/${token}`)
const getUserProfile = () => get(`${API_URL}/profile`)
const updateUserProfile = (data) => patch(`${API_URL}/profile`, data)
const getAllPhotos = () => get(`${API_URL}/photos`)
const getPhoto = (id) => get(`${API_URL}/photos/${id}`)
const getImage = (id) => get(`${API_URL}/getImage/${id}`)
const uploadPhoto = (formData) => file(`${API_URL}/photos`, formData)
const deletePhoto = (id) => del(`${API_URL}/photos/${id}`)
const uploadProfilePicture = (formData) => file(`${API_URL}/profile`, formData)
const setProfilePicture = async (data) => {
  const response = await fetch(`${API_URL}/profile/picture`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to set profile picture')
  }

  return await response.json()
}
const addPhotoTags = (data) => patch(`${API_URL}/photos/tags`, data)
const getUserPhotos = (userEmail) => get(`${API_URL}/photos/user/${userEmail}`)
const createTag = (tagName) => post(`${API_URL}/tags`, { name: tagName })
const getAllTags = () => get(`${API_URL}/tags`)
const getProfileImages = () => get(`${API_URL}/profile/images`)

const getPhotoUrl = (photo) => {
  if (photo.lastChange === 'original') {
    return `http://localhost:3000/api/getImage/${photo.id}`
  } else {
    return `http://localhost:3000/api/getImage/${photo.id}/filter/${photo.lastChange}`
  }
}

export {
  loginUser,
  registerUser,
  confirmUserAccount,
  getUserProfile,
  updateUserProfile,
  getAllPhotos,
  getPhoto,
  getImage,
  uploadPhoto,
  deletePhoto,
  uploadProfilePicture,
  setProfilePicture,
  addPhotoTags,
  getUserPhotos,
  createTag,
  getAllTags,
  getPhotoUrl,
  getProfileImages,
}
