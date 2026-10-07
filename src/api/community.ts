import request from '@/utils/http'

export type CommunityDomain =
  | 'body'
  | 'mind'
  | 'sleep_recovery'
  | 'nutrition_metabolism'
  | 'longevity'
  | 'sustainable_performance'
  | 'life_wellbeing'

export interface CommunityGroup {
  id: string
  publicId: number
  name: string
  description: string
  avatarUrl?: string
  visibility: 'public' | 'private'
  status: 'active' | 'archived'
  ownerName: string
  memberCount: number
  goalCount: number
  messageCount: number
  createdAt: string
}

export interface ChallengeDay {
  id?: string
  dayNumber: number
  title: string
  content: string
  action: string
  trackingMode: 'manual' | 'workout'
  activityCode?: string
  workoutMetric?: 'workout_count' | 'active_minutes' | 'distance_km' | 'calories' | 'steps'
  targetValue?: number
}

export interface ChallengePayload {
  slug: string
  title: string
  summary: string
  description: string
  domain: CommunityDomain
  coverUrl: string
  durationDays: number
  expertName: string
  expertTitle: string
  expertCredential: string
  expertAvatarUrl: string
  availableFrom: string
  availableUntil: string
  sortOrder: number
}

export interface CommunityChallenge extends ChallengePayload {
  id: string
  status: 'draft' | 'published' | 'archived'
  premiumRequired: boolean
  enrollmentCount: number
  dayCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  days: ChallengeDay[]
  expert?: { name: string; title: string; credential: string; avatarUrl?: string }
}

export function fetchCommunityGroups(params?: Record<string, string>) {
  return request.get<{ items: CommunityGroup[] }>({
    url: '/api/community/groups',
    params
  })
}

export function fetchCommunityChallenges(params?: Record<string, string>) {
  return request.get<{ items: CommunityChallenge[] }>({
    url: '/api/community/challenges',
    params
  })
}

export function fetchCommunityChallenge(id: string) {
  return request.get<CommunityChallenge>({
    url: `/api/community/challenges/${id}`
  })
}

export function createCommunityChallenge(data: ChallengePayload) {
  return request.post<CommunityChallenge>({
    url: '/api/community/challenges',
    data
  })
}

export function updateCommunityChallenge(id: string, data: ChallengePayload) {
  return request.request<CommunityChallenge>({
    url: `/api/community/challenges/${id}`,
    method: 'PATCH',
    data
  })
}

export function saveCommunityChallengeDay(
  id: string,
  dayNumber: number,
  data: Omit<ChallengeDay, 'id' | 'dayNumber'>
) {
  return request.put<CommunityChallenge>({
    url: `/api/community/challenges/${id}/days/${dayNumber}`,
    data
  })
}

export function publishCommunityChallenge(id: string) {
  return request.post<void>({
    url: `/api/community/challenges/${id}/publish`
  })
}

export function archiveCommunityChallenge(id: string) {
  return request.post<void>({
    url: `/api/community/challenges/${id}/archive`
  })
}
