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

export const formatDate = (value: string, locale: Composer['locale']['value']) =>
  new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'medium' }).format(
    new Date(value)
  )

export const formatDateTime = (value: string, locale: Composer['locale']['value']) =>
  new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))

export const formatDuration = (minutes: number, t: Composer['t']) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return t('wellness.common.duration', { hours, minutes: rest })
}

export const qualityTagType = (quality: string) =>
  quality === 'normal' ? 'success' : quality === 'partial' ? 'warning' : 'danger'
