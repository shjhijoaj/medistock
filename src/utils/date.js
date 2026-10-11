/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @param {string} format - 格式字符串（默认'YYYY-MM-DD'）
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  let dateObj = date
  if (typeof date === 'string') {
    dateObj = new Date(date)
    if (isNaN(dateObj)) return date // 无法解析则返回原字符串
  }
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
}

/**
 * 计算距离过期的天数
 * @param {Date|string} expiryDate - 过期日期
 * @returns {number} 剩余天数（负数表示已过期）
 */
export function daysToExpiry(expiryDate) {
  if (!expiryDate) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let expiryDateObj = expiryDate
  if (typeof expiryDate === 'string') {
    expiryDateObj = new Date(expiryDate)
    if (isNaN(expiryDateObj)) return 0
  }
  
  // 设置过期日期的午夜时间
  expiryDateObj.setHours(0, 0, 0, 0)
  
  // 计算差异（毫秒）
  const diffTime = expiryDateObj - today
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 获取有效期状态
 * @param {Date|string} expiryDate - 过期日期
 * @returns {string} 状态标签（'normal'正常, 'soon'即将过期, 'expired'已过期）
 */
export function getExpiryStatus(expiryDate) {
  const days = daysToExpiry(expiryDate)
  
  if (days <= 0) {
    return 'expired'
  } else if (days <= 30) {
    return 'soon'
  } else {
    return 'normal'
  }
}