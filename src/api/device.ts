import request from '@/utils/http'

export interface DeviceListParams {
  page?: number
  pageSize?: number
  keyword?: string
  manufacturer?: string
  status?: string
  connectionStatus?: string
  bindingStatus?: string
  startDate?: string
  endDate?: string
}

export interface DeviceUser {
  id: string
  name: string
  email?: string
}

export interface DeviceItem {
  id: string
  serialNumber: string
  modelId: string
  manufacturer: string
  modelCode: string
  modelName: string
  deviceType: string
  protocolType: string
  capabilities?: unknown
  hardwareRevision?: string
  firmwareVersion?: string
  status: 'inactive' | 'active' | 'suspended' | 'retired'
  connectionStatus: 'online' | 'offline' | 'unknown'
  activatedAt?: string
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
  bindingId?: string
  boundUser?: DeviceUser
  displayName?: string
  wristSide?: 'unspecified' | 'left' | 'right'
  isPrimary: boolean
  boundAt?: string
  lastSyncedAt?: string
}

export interface DeviceStats {
  totalDevices: number
  boundDevices: number
  onlineDevices: number
  modelCount: number
}

export interface DevicePageData {
  items: DeviceItem[]
  total: number
  page: number
  pageSize: number
  stats: DeviceStats
}

export interface DeviceBindingEvent {
  id: string
  bindingId: string
  eventType: 'bind' | 'unbind' | 'transfer'
  reasonCode?: string
  source: string
  user?: DeviceUser
  occurredAt: string
}

export interface DeviceDetail {
  summary: DeviceItem
  bindingEvents: DeviceBindingEvent[]
}

export const fetchDeviceRecords = (params: DeviceListParams) =>
  request.get<DevicePageData>({ url: '/api/devices', params })

export const fetchDeviceDetail = (id: string) =>
  request.get<DeviceDetail>({ url: `/api/devices/${id}` })
