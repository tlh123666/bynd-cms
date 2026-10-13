import request from '@/utils/http'

export interface CmsUser {
  id: string
  email: string
  phone: string
  username: string
  fullName: string
  avatarUrl: string
  birthDate: string
  biologicalSex: string
  genderIdentity: string
  locale: string
  timezone: string
  heightCm: number | null
  weightKg: number | null
  status: number
  profileCompletedAt: string
  lastLoginAt: string
  createdAt: string
  updatedAt: string
}

export interface CmsUserList {
  items: CmsUser[]
  total: number
  page: number
  pageSize: number
}

export type CmsUserPayload = Omit<
  CmsUser,
  'id' | 'profileCompletedAt' | 'lastLoginAt' | 'createdAt' | 'updatedAt'
>

export interface CmsUserListParams {
  keyword?: string
  status?: number
  page: number
  pageSize: number
}

export function fetchUsers(params: CmsUserListParams) {
  return request.get<CmsUserList>({ url: '/api/users', params })
}

export function fetchUser(id: string) {
  return request.get<CmsUser>({ url: `/api/users/${id}` })
}

export function createUser(data: CmsUserPayload) {
  return request.post<CmsUser>({ url: '/api/users', data })
}

export function updateUser(id: string, data: CmsUserPayload) {
  return request.put<CmsUser>({ url: `/api/users/${id}`, data })
}

export function deactivateUser(id: string) {
  return request.del<void>({ url: `/api/users/${id}` })
}
