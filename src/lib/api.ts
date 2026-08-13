// Central API helper for all fetch calls
import { signIn, signOut } from 'next-auth/react'

const BASE = ''

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 401) {
    throw new Error('Unauthorized')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

// ===== Auth =====
export const authApi = {
  register: (data: { email: string; name?: string; password: string }) =>
    authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    signIn('credentials', { email, password, redirect: false }),

  logout: () => signOut({ redirect: false }),

  getProfile: () => authFetch('/api/auth/profile'),

  updateProfile: (data: { name?: string; email?: string }) =>
    authFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
}

// ===== Businesses =====
export const businessApi = {
  list: () => authFetch('/api/businesses'),

  create: (data: FormData) =>
    fetch('/api/businesses', { method: 'POST', body: data }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error) })
      return r.json()
    }),

  get: (id: string) => authFetch(`/api/businesses/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    authFetch(`/api/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => authFetch(`/api/businesses/${id}`, { method: 'DELETE' }),
}

// ===== Categories =====
export const categoryApi = {
  list: (businessId: string) => authFetch(`/api/businesses/${businessId}/categories`),

  create: (businessId: string, data: { name: string }) =>
    authFetch(`/api/businesses/${businessId}/categories`, { method: 'POST', body: JSON.stringify(data) }),

  update: (businessId: string, categoryId: string, data: { name?: string; isHidden?: boolean }) =>
    authFetch(`/api/businesses/${businessId}/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (businessId: string, categoryId: string) =>
    authFetch(`/api/businesses/${businessId}/categories/${categoryId}`, { method: 'DELETE' }),

  reorder: (businessId: string, categories: { id: string; sortOrder: number }[]) =>
    authFetch(`/api/businesses/${businessId}/categories/reorder`, { method: 'PUT', body: JSON.stringify({ items: categories }) }),
}

// ===== Menu Items =====
export const itemApi = {
  list: (businessId: string, categoryId: string) =>
    authFetch(`/api/businesses/${businessId}/categories/${categoryId}/items`),

  create: (businessId: string, categoryId: string, data: Record<string, unknown>) =>
    authFetch(`/api/businesses/${businessId}/categories/${categoryId}/items`, { method: 'POST', body: JSON.stringify(data) }),

  update: (businessId: string, categoryId: string, itemId: string, data: Record<string, unknown>) =>
    authFetch(`/api/businesses/${businessId}/categories/${categoryId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (businessId: string, categoryId: string, itemId: string) =>
    authFetch(`/api/businesses/${businessId}/categories/${categoryId}/items/${itemId}`, { method: 'DELETE' }),

  reorder: (businessId: string, categoryId: string, items: { id: string; sortOrder: number }[]) =>
    authFetch(`/api/businesses/${businessId}/items/reorder`, { method: 'PUT', body: JSON.stringify({ categoryId, items }) }),
}

// ===== Upload =====
export const uploadApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch('/api/upload', { method: 'POST', body: fd }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error) })
      return r.json()
    })
  },
}

// ===== Menu Upload =====
export const menuUploadApi = {
  get: (businessId: string) => authFetch(`/api/businesses/${businessId}/upload`),
  upload: (businessId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`/api/businesses/${businessId}/upload`, { method: 'POST', body: fd }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error) })
      return r.json()
    })
  },
  delete: (businessId: string) =>
    authFetch(`/api/businesses/${businessId}/upload`, { method: 'DELETE' }),
  publish: (businessId: string, uploadId: string, status: string) =>
    authFetch(`/api/businesses/${businessId}/publish`, { method: 'PUT', body: JSON.stringify({ uploadId, status }) }),
}

// ===== QR Code =====
export const qrApi = {
  get: (businessId: string) => authFetch(`/api/businesses/${businessId}/qr`),
}

// ===== Design =====
export const designApi = {
  get: (businessId: string) => authFetch(`/api/businesses/${businessId}/design`),
  update: (businessId: string, data: Record<string, unknown>) =>
    authFetch(`/api/businesses/${businessId}/design`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ===== Analytics =====
export const analyticsApi = {
  get: (businessId: string) => authFetch(`/api/businesses/${businessId}/analytics`),
  track: (data: { businessId: string; eventType: string; itemId?: string; categoryId?: string }) =>
    fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {}),
}

// ===== Public Menu =====
export const publicMenuApi = {
  getBySlug: (slug: string) => fetch(`/api/menu/${slug}`).then(r => r.json()),
}

// ===== Admin =====
export const adminApi = {
  getStats: () => authFetch('/api/admin/stats'),
  getBusinesses: (page?: number) => authFetch(`/api/admin/businesses?page=${page || 1}`),
  updateBusiness: (id: string, data: { status: string }) =>
    authFetch(`/api/admin/businesses`, { method: 'PUT', body: JSON.stringify({ businessId: id, ...data }) }),
  getTemplates: () => authFetch('/api/admin/templates'),
  createTemplate: (data: Record<string, unknown>) =>
    authFetch('/api/admin/templates', { method: 'POST', body: JSON.stringify(data) }),
}

// ===== AI Scan =====
export const aiScanApi = {
  upload: (businessId: string, file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    return fetch(`/api/businesses/${businessId}/ai-scan`, { method: 'POST', body: fd }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error) })
      return r.json()
    })
  },
}
