export function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export function getGoogleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
}

export function getGoogleRedirectUri() {
  return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback'
}

export function buildGoogleAuthUrl(returnPath) {
  const clientId = getGoogleClientId()
  const redirectUri = getGoogleRedirectUri()
  const scope = encodeURIComponent('openid email profile')
  const state = encodeURIComponent(returnPath || (window.location.pathname + window.location.search))

  return (
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`
  )
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path}`

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {}
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  Object.assign(headers, options.headers || {})

  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      const newToken = localStorage.getItem('access_token')
      headers.Authorization = `Bearer ${newToken}`
      return fetch(url, { ...options, headers })
    }
    clearTokens()
    throw new AuthError('Unauthorized', 401)
  }

  return response
}

export class AuthError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function getTokens() {
  if (typeof window === 'undefined') return null
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  }
}

export function setTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

export function clearTokens() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export async function apiListFiles() {
  const response = await apiRequest('/v1/files')
  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.status}`)
  }
  return response.json()
}

export async function apiGetFile(fileUuid) {
  const response = await apiRequest(`/v1/files/${fileUuid}`)
  if (!response.ok) {
    throw new Error(`Failed to get file: ${response.status}`)
  }
  return response.text()
}

export async function apiUploadFile(fileUuid, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiRequest(`/v1/files/${fileUuid}`, {
    method: 'PUT',
    body: formData,
  })
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.status}`)
  }
  return response.json()
}

export async function apiDeleteFile(fileUuid) {
  const response = await apiRequest(`/v1/files/${fileUuid}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.status}`)
  }
  return response.json()
}

export async function tryRefreshToken() {
  const tokens = getTokens()
  if (!tokens?.refreshToken) return false

  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    })

    if (!response.ok) return false

    const data = await response.json()
    setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}
