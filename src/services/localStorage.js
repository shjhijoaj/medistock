const STORAGE_PREFIX = 'med_sys_'

export default {
  // 设置本地存储
  set(key, value) {
    try {
      const stringValue = JSON.stringify(value)
      localStorage.setItem(STORAGE_PREFIX + key, stringValue)
      return true
    } catch (error) {
      console.error('localStorage set error:', error)
      return false
    }
  },
  
  // 获取本地存储
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key)
      return value ? JSON.parse(value) : defaultValue
    } catch (error) {
      console.error('localStorage get error:', error)
      return defaultValue
    }
  },
  
  // 删除本地存储
  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },
  
  // 清空所有本地存储
  clear() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },
  
  // 备份数据到本地文件
  backup() {
    const data = {}
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const pureKey = key.replace(STORAGE_PREFIX, '')
        data[pureKey] = this.get(pureKey)
      }
    })
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `med_sys_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  },
  
  // 从本地文件恢复数据
  restore(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target.result)
          
          // 清除现有数据
          this.clear()
          
          // 恢复备份数据
          Object.keys(data).forEach(key => {
            this.set(key, data[key])
          })
          
          resolve('数据恢复成功')
        } catch (error) {
          reject('解析备份文件失败')
        }
      }
      reader.onerror = () => reject('读取备份文件失败')
      reader.readAsText(file)
    })
  }
}