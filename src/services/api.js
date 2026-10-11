import axios from 'axios'
import store from '@/store'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 添加认证token
    const token = store.state.auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          store.dispatch('auth/logout')
          break
        case 403:
          // 权限不足处理
          break
        default:
          break
      }
    }
    return Promise.reject(error)
  }
)

// 药品API
export const medicineApi = {
  getAll: () => api.get('/medicines'),
  getById: id => api.get(`/medicines/${id}`),
  create: medicine => api.post('/medicines', medicine),
  update: (id, medicine) => api.put(`/medicines/${id}`, medicine),
  delete: id => api.delete(`/medicines/${id}`),
  search: query => api.get('/medicines/search', { params: { query } }),
  inbound: data => api.post('/transactions/inbound', data),
  outbound: data => api.post('/transactions/outbound', data)
}

// 供应商API
export const supplierApi = {
  getAll: () => api.get('/suppliers'),
  getById: id => api.get(`/suppliers/${id}`),
  create: supplier => api.post('/suppliers', supplier),
  update: (id, supplier) => api.put(`/suppliers/${id}`, supplier),
  delete: id => api.delete(`/suppliers/${id}`),
  search: query => api.get('/suppliers/search', { params: { query } })
}

// 用户认证API
export const authApi = {
  login: credentials => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile')
}

// 备份恢复API
export const backupApi = {
  createBackup: () => api.post('/backup/create'),
  restoreBackup: backupFile => {
    const formData = new FormData()
    formData.append('backup', backupFile)
    return api.post('/backup/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default api