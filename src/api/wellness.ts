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
  storyStatus?: string
  contextKind?: string
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

export interface DiaryItem {
  id: string
  user: ManagedUser
  statDate: string
  timezone: string
  title?: string
  bodyPreview: string
  storyStatus: 'pending' | 'ready' | 'failed'
  storyModel?: string
  storyGeneratedAt?: string
  contextCount: number
  eventCount: number
  createdAt: string
  updatedAt: string
}

export interface DiaryStats {
  recordCount: number
  userCount: number
  readyCount: number
  contextDiaryCount: number
  readyRate: number
  contextCoverage: number
}

export interface DiaryContextItem {
  id: string
  kind: string
  valueKey?: string
  label: string
  note?: string
  position: number
}

export interface DiaryEvent {
  id: string
  occurredAt: string
  category: string
  valueKey?: string
  label: string
  note?: string
  intensity?: number
  numericValue?: number
  unit?: string
  inputMethod: string
  aiConfidence?: number
}

export interface DiaryDetail extends DiaryItem {
  storyBody: string
  contextItems: DiaryContextItem[]
  events: DiaryEvent[]
}

export interface DiaryDimensionCount {
  name: string
  value: number
}

export interface DiaryDailyTrend {
  date: string
  diaryCount: number
  readyCount: number
  contextCount: number
}

export interface DiaryDashboard {
  startDate: string
  endDate: string
  summary: DiaryStats
  dailyTrend: DiaryDailyTrend[]
  statusDistribution: DiaryDimensionCount[]
  contextDistribution: DiaryDimensionCount[]
  inputDistribution: DiaryDimensionCount[]
  modelDistribution: DiaryDimensionCount[]
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

export const fetchDiaryRecords = (params: WellnessListParams) =>
  request.get<PageData<DiaryItem, DiaryStats>>({ url: '/api/wellness/diaries', params })

export const fetchDiaryDetail = (id: string) =>
  request.get<DiaryDetail>({ url: `/api/wellness/diaries/${id}` })

export const fetchDiaryDashboard = (params: Pick<WellnessListParams, 'startDate' | 'endDate'>) =>
  request.get<DiaryDashboard>({ url: '/api/wellness/diaries/dashboard', params })

export const fetchHeartRateRecords = (params: WellnessListParams) =>
  request.get<PageData<HeartRateItem, HeartRateStats>>({ url: '/api/wellness/heart-rate', params })

export const fetchHeartRateDetail = (id: string) =>
  request.get<HeartRateDetail>({ url: `/api/wellness/heart-rate/${id}` })
