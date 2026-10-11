/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export function validatePhone(phone) {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
  const reg = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/
  return reg.test(email)
}

/**
 * 验证数值范围
 * @param {number} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否在范围内
 */
export function validateNumberRange(value, min, max) {
  return value >= min && value <= max
}

/**
 * 验证日期格式
 * @param {string} date - 日期字符串
 * @returns {boolean} 是否有效
 */
export function validateDate(date) {
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime())
}

/**
 * 验证药品信息
 * @param {Object} medicine - 药品信息
 * @returns {string|null} 错误信息或null（有效）
 */
export function validateMedicine(medicine) {
  if (!medicine.name || medicine.name.trim().length < 2) {
    return '药品名称至少2个字符'
  }
  
  if (!medicine.spec) {
    return '请填写药品规格'
  }
  
  if (!medicine.batch) {
    return '请填写药品批号'
  }
  
  if (medicine.minStock <= 0) {
    return '最小库存必须大于0'
  }
  
  if (medicine.expiryDate && !validateDate(medicine.expiryDate)) {
    return '有效日期格式不正确'
  }
  
  return null
}

/**
 * 验证供应商信息
 * @param {Object} supplier - 供应商信息
 * @returns {string|null} 错误信息或null（有效）
 */
export function validateSupplier(supplier) {
  if (!supplier.name || supplier.name.trim().length < 2) {
    return '供应商名称至少2个字符'
  }
  
  if (!supplier.contact) {
    return '请填写联系人'
  }
  
  if (!validatePhone(supplier.phone)) {
    return '联系电话格式不正确'
  }
  
  return null
}