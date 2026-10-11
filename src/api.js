export async function request(url, options = {}) {
  const response = await fetch('/api' + url, { headers: { 'Content-Type': 'application/json' }, ...options })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '服务暂时不可用，请重试')
  return data
}
