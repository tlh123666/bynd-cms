import request from '@/utils/http'

export interface ManagedUser {
  id: string
  name: string
  email?: string
}

export interface WellnessListParams {
  waveformKind?: string
  measurementContext?: string
  kind?: string
  considerTraining?: boolean
  algorithmVersion?: number
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
  averageSleepHours: number | null
  averageScore: number | null
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
  preferences: SleepPreferences | null
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
  details: Record<string, string | number | boolean>
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
  note: string
  revision: string
  trackers: DiaryTracker[]
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
  averageHeartRate: number | null
  averageRestingRate: number | null
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
  settings: HeartSettings | null
  measurements: HeartMeasurement[]
  measurementTotal: number
  sampleTotal: number
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

export interface SleepPreferences {
  targetSleepMinutes: number
  targetBedtimeMinute: number
  targetWakeMinute: number
  windDownMinutes: number
  showStages: boolean
  showBiologicalClock: boolean
  showRespiration: boolean
  timezone: string
}
export interface HeartSettings {
  zoneModel: string
  maxHeartRate: number | null
  restingHeartRate: number | null
  showEstimatedPressure: boolean
  notifyHighResting: boolean
  notifyIrregularRhythm: boolean
  algorithmVersion: number
}
export interface HeartMeasurement {
  id: string
  measuredAt: string
  waveformKind: string
  measurementContext: string
  symptoms: string[]
  durationMillis: number
  sampleCount: number
  heartRate: number | null
  hrvMs: number | null
  source: string
  deviceSerial: string
}
export interface DiaryTracker {
  trackerKey: string
  enabled: boolean
  favorite: boolean
  displayOrder: number
  customLabel: string | null
}
export interface VitalityItem {
  user: ManagedUser
  kind: 'recovery' | 'energy'
  observedAt: string
  considerTraining: boolean
  algorithmVersion: number
  score: number
}
export interface VitalityStats {
  recordCount: number
  userCount: number
  averageRecovery: number | null
  averageEnergy: number | null
}
export interface VitalityPreferences {
  considerTraining: boolean
  showFactors: boolean
  showForecast: boolean
  energyShowForecast: boolean
  showWindows: boolean
  lowRecoveryNotice: boolean
  morningNotice: boolean
  movementNotice: boolean
  goalNotice: boolean
  stepGoal: number
  activeMinutesGoal: number
}
export interface VitalityDetail {
  user: ManagedUser
  preferences: VitalityPreferences | null
}
export const fetchVitalityRecords = (params: WellnessListParams) =>
  request.get<PageData<VitalityItem, VitalityStats>>({ url: '/api/wellness/vitality', params })
export const fetchVitalityDetail = (id: string) =>
  request.get<VitalityDetail>({ url: `/api/wellness/vitality/${encodeURIComponent(id)}` })

export interface HeartMeasurementItem extends HeartMeasurement {
  user: ManagedUser
}
export interface HeartMeasurementStats {
  recordCount: number
  userCount: number
  ppgCount: number
  ecgCount: number
}
export const fetchHeartMeasurements = (params: WellnessListParams) =>
  request.get<PageData<HeartMeasurementItem, HeartMeasurementStats>>({
    url: '/api/wellness/heart-measurements',
    params
  })
