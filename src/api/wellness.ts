import request from '@/utils/http'

export interface ManagedUser {
  id: string
  name: string
  email?: string
}

export interface WellnessListParams {
  page?: number
  pageSize?: number
  keyword?: string
  startDate?: string
  endDate?: string
  source?: string
  dataQuality?: string
  sessionType?: string
  context?: string
  mood?: number
}

export interface PageData<T, S> {
  items: T[]
  total: number
  page: number
  pageSize: number
  stats: S
}

export interface SleepItem {
  id: string
  user: ManagedUser
  statDate: string
  timezone: string
  sessionCount: number
  napCount: number
  sleepMinutes: number
  deepSleepMinutes: number
  remSleepMinutes: number
  awakeMinutes: number
  efficiencyPercent?: number
  sleepScore?: number
  avgHeartRate?: number
  avgSpo2Percent?: number
  hrvMs?: number
  source: string
  dataQuality: string
  primaryDeviceSerial?: string
  updatedAt: string
}

export interface SleepStats {
  recordCount: number
  userCount: number
  averageSleepHours: number
  averageScore: number
}

export interface SleepSession {
  id: string
  sessionType: string
  startAt: string
  endAt: string
  durationMinutes: number
  asleepMinutes: number
  wakeCount: number
  sleepScore?: number
  dataQuality: string
  deviceSerial: string
}

export interface SleepDetail {
  summary: SleepItem
  sessions: SleepSession[]
}

export interface JournalItem {
  id: string
  user: ManagedUser
  statDate: string
  timezone: string
  title?: string
  contentPreview: string
  mood?: number
  createdAt: string
  updatedAt: string
}

export interface JournalStats {
  recordCount: number
  userCount: number
  averageMood: number
  moodCount: number
}

export interface JournalDetail extends JournalItem {
  content: string
}

export interface HeartRateItem {
  id: string
  user: ManagedUser
  statDate: string
  timezone: string
  avgHeartRate?: number
  minHeartRate?: number
  maxHeartRate?: number
  restingHeartRate?: number
  wakingAvgHeartRate?: number
  sleepAvgHeartRate?: number
  sampleCount: number
  hrvMs?: number
  source: string
  dataQuality: string
  primaryDeviceSerial?: string
  updatedAt: string
}

export interface HeartRateStats {
  recordCount: number
  userCount: number
  averageHeartRate: number
  averageRestingRate: number
}

export interface HeartRateSample {
  id: string
  measuredAt: string
  bpm: number
  context: string
  source: string
  deviceSerial: string
}

export interface HeartRateDetail {
  summary: HeartRateItem
  samples: HeartRateSample[]
}

export const fetchSleepRecords = (params: WellnessListParams) =>
  request.get<PageData<SleepItem, SleepStats>>({ url: '/api/wellness/sleep', params })

export const fetchSleepDetail = (id: string) =>
  request.get<SleepDetail>({ url: `/api/wellness/sleep/${id}` })

export const fetchJournalRecords = (params: WellnessListParams) =>
  request.get<PageData<JournalItem, JournalStats>>({ url: '/api/wellness/journals', params })

export const fetchJournalDetail = (id: string) =>
  request.get<JournalDetail>({ url: `/api/wellness/journals/${id}` })

export const fetchHeartRateRecords = (params: WellnessListParams) =>
  request.get<PageData<HeartRateItem, HeartRateStats>>({ url: '/api/wellness/heart-rate', params })

export const fetchHeartRateDetail = (id: string) =>
  request.get<HeartRateDetail>({ url: `/api/wellness/heart-rate/${id}` })
