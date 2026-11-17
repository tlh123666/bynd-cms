<template>
  <section class="wellness-details">
    <h3 v-if="title">{{ title }}</h3>
    <ElDescriptions v-if="value && Object.keys(value).length" :column="1" border size="small">
      <ElDescriptionsItem
        v-for="[key, item] in Object.entries(value)"
        :key="key"
        :label="label(key)"
      >
        <ElTag v-if="typeof item === 'boolean'" :type="item ? 'success' : 'info'" size="small">{{
          t(`wellness.experience.${item ? 'yes' : 'no'}`)
        }}</ElTag>
        <span v-else>{{ display(key, item) }}</span>
      </ElDescriptionsItem>
    </ElDescriptions>
    <ElEmpty
      v-else
      :description="emptyText || t('wellness.experience.noOverrides')"
      :image-size="56"
    />
  </section>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  const props = withDefaults(
    defineProps<{ value?: object | null; title?: string; prefix?: string; emptyText?: string }>(),
    { prefix: 'wellness.experience.fields' }
  )
  const { t, te, locale } = useI18n()
  const label = (key: string) => (te(`${props.prefix}.${key}`) ? t(`${props.prefix}.${key}`) : key)
  const display = (key: string, item: unknown): string => {
    if (item == null || item === '') return '—'
    if (typeof item === 'number') {
      if (key === 'targetBedtimeMinute' || key === 'targetWakeMinute')
        return `${String(Math.floor(item / 60)).padStart(2, '0')}:${String(item % 60).padStart(2, '0')}`
      if (key === 'targetSleepMinutes' || key === 'windDownMinutes' || key === 'activeMinutesGoal')
        return t('wellness.experience.minutes', { value: item })
      return new Intl.NumberFormat(locale.value).format(item)
    }
    if (Array.isArray(item))
      return (
        item
          .map((v) =>
            key === 'symptoms' && te(`wellness.experience.values.${v}`)
              ? t(`wellness.experience.values.${v}`)
              : String(v)
          )
          .join(', ') || '—'
      )
    if (typeof item === 'string')
      return [
        'kind',
        'portion',
        'zoneModel',
        'waveformKind',
        'measurementContext',
        'source'
      ].includes(key) && te(`wellness.experience.values.${item}`)
        ? t(`wellness.experience.values.${item}`)
        : item
    return '—'
  }
</script>
<style scoped>
  .wellness-details {
    margin-top: 20px;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  h3 {
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
  }
</style>
