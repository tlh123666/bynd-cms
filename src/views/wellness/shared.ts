import type { Composer } from 'vue-i18n'

export const pageAdapter = <T>(response: {
  items: T[]
  total: number
  page: number
  pageSize: number
}) => ({
  records: response.items,
  total: response.total,
  current: response.page,
  size: response.pageSize
})

const dateLocale = (locale: string) =>
  locale.startsWith('zh') ? 'zh-CN' : locale.startsWith('pt') ? 'pt-BR' : 'en-US'
export const formatDate = (value: string, locale: Composer['locale']['value']) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '')
  if (!match) return '—'
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(date)
}
export const formatDateTime = (
  value: string,
  locale: Composer['locale']['value'],
  timeZone?: string
) => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(date)
}

export const formatDuration = (minutes: number, t: Composer['t']) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return t('wellness.common.duration', { hours, minutes: rest })
}

export const qualityTagType = (quality: string) =>
  quality === 'normal' ? 'success' : quality === 'partial' ? 'warning' : 'danger'
