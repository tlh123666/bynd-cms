import request from '@/utils/http'

export type ContentLocale = 'zh' | 'en' | 'pt'
export interface CategoryTranslation {
  locale: ContentLocale
  name: string
  description: string
}
export interface ReadingCategory {
  id: string
  slug: string
  icon: string
  colorKey: string
  sortOrder: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  translations: CategoryTranslation[]
}
export type CategoryPayload = Omit<ReadingCategory, 'id' | 'createdAt' | 'updatedAt'>
export interface ReadingAsset {
  id: string
  kind: 'cover' | 'epub'
  originalFilename: string
  mediaType: string
  fileSizeBytes: number
  sha256: string
  createdAt: string
  url?: string
}
export interface ReadingTranslation {
  locale: ContentLocale
  title: string
  subtitle?: string
  summary: string
  contentFormat: 'html' | 'markdown' | 'epub'
  body?: string
  contentAssetId?: string
  searchKeywords: string
}
export interface ReadingPublication {
  id: string
  slug: string
  contentType: 'article' | 'epub'
  categoryId: string
  coverAssetId?: string
  defaultLocale: ContentLocale
  author: string
  publisher?: string
  isbn13?: string
  publishedOn?: string
  estimatedReadMinutes: number
  accessTier: 'free' | 'premium'
  status: 'draft' | 'published' | 'archived'
  isFeatured: boolean
  sortOrder: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  translations: ReadingTranslation[]
}
export type PublicationPayload = Omit<
  ReadingPublication,
  'id' | 'publishedAt' | 'createdAt' | 'updatedAt'
>
export interface PageData<T> {
  items: T[]
  pagination: { page: number; limit: number; total: number }
}

export const fetchReadingCategories = () =>
  request.get<{ items: ReadingCategory[] }>({ url: '/api/content/readings/categories' })
export const createReadingCategory = (data: CategoryPayload) =>
  request.post<ReadingCategory>({ url: '/api/content/readings/categories', data })
export const updateReadingCategory = (id: string, data: CategoryPayload) =>
  request.put<ReadingCategory>({ url: `/api/content/readings/categories/${id}`, data })
export const deleteReadingCategory = (id: string) =>
  request.del<void>({ url: `/api/content/readings/categories/${id}` })
export const fetchReadingPublications = (params: Record<string, unknown>) =>
  request.get<PageData<ReadingPublication>>({ url: '/api/content/readings/publications', params })
export const fetchReadingPublication = (id: string) =>
  request.get<ReadingPublication>({ url: `/api/content/readings/publications/${id}` })
export const createReadingPublication = (data: PublicationPayload) =>
  request.post<ReadingPublication>({ url: '/api/content/readings/publications', data })
export const updateReadingPublication = (id: string, data: PublicationPayload) =>
  request.put<ReadingPublication>({ url: `/api/content/readings/publications/${id}`, data })
export const archiveReadingPublication = (id: string) =>
  request.del<void>({ url: `/api/content/readings/publications/${id}` })
export const fetchReadingAssets = (params: Record<string, unknown>) =>
  request.get<PageData<ReadingAsset>>({ url: '/api/content/readings/assets', params })
export const uploadReadingAsset = (kind: 'cover' | 'epub', file: File) => {
  const data = new FormData()
  data.append('file', file)
  return request.post<ReadingAsset>({
    url: '/api/content/readings/assets',
    params: { kind },
    data,
    timeout: 120000,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const deleteReadingAsset = (id: string) =>
  request.del<void>({ url: `/api/content/readings/assets/${id}` })

export interface GuideTranslation {
  locale: ContentLocale
  title: string
  subtitle: string
  description: string
}
export interface GuideDayTranslation {
  locale: ContentLocale
  title: string
  summary: string
  content: string
  actionText: string
}
export interface GuideDay {
  dayNumber: number
  icon: string
  actionRoute: string
  isEnabled: boolean
  translations: GuideDayTranslation[]
}
export interface GuideContent {
  programKey: string
  version: number
  defaultLocale: ContentLocale
  totalDays: number
  status: 'draft' | 'published'
  publishedAt?: string
  updatedAt?: string
  translations: GuideTranslation[]
  days: GuideDay[]
}
export const fetchGuideContent = () =>
  request.get<GuideContent>({ url: '/api/content/guidance/body-foundations' })
export const saveGuideContent = (
  data: Pick<GuideContent, 'defaultLocale' | 'status' | 'translations'>
) => request.put<GuideContent>({ url: '/api/content/guidance/body-foundations', data })
export const saveGuideDay = (day: number, data: Omit<GuideDay, 'dayNumber'>) =>
  request.put<GuideContent>({ url: `/api/content/guidance/body-foundations/days/${day}`, data })
