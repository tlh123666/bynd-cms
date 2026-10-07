<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading"
      ><div
        ><p class="eyebrow">HEART RATE</p><h1>{{ t('wellness.heartRate.title') }}</h1
        ><p>{{ t('wellness.heartRate.subtitle') }}</p></div
      ></div
    >
    <StatCards :items="statCards" />
    <ElCard class="wellness-card art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="load">
        <template #left
          ><div class="wellness-search">
            <ElInput
              v-model="filters.keyword"
              class="keyword"
              clearable
              :placeholder="t('wellness.common.userSearch')"
              @keyup.enter="search"
            />
            <ElDatePicker
              v-model="filters.dates"
              class="date-range"
              type="daterange"
              value-format="YYYY-MM-DD"
              :start-placeholder="t('wellness.common.startDate')"
              :end-placeholder="t('wellness.common.endDate')"
            />
            <ElSelect
              v-model="filters.context"
              class="select-filter"
              clearable
              :placeholder="t('wellness.heartRate.context')"
              ><ElOption
                v-for="item in contexts"
                :key="item"
                :label="t(`wellness.context.${item}`)"
                :value="item"
            /></ElSelect>
            <ElSelect
              v-model="filters.dataQuality"
              class="select-filter"
              clearable
              :placeholder="t('wellness.common.quality')"
              ><ElOption
                v-for="item in qualityOptions"
                :key="item"
                :label="t(`wellness.quality.${item}`)"
                :value="item"
            /></ElSelect>
            <ElButton type="primary" @click="search">{{ t('table.searchBar.search') }}</ElButton
            ><ElButton @click="reset">{{ t('table.searchBar.reset') }}</ElButton>
          </div></template
        >
      </ArtTableHeader>
      <ArtTable
        :loading="loading"
        :data="items"
        :pagination="pagination"
        row-key="id"
        @pagination:size-change="changeSize"
        @pagination:current-change="changePage"
      >
        <ElTableColumn :label="t('wellness.common.user')" min-width="210"
          ><template #default="{ row }"
            ><div class="user-cell"
              ><strong>{{ row.user.name }}</strong
              ><small>{{ row.user.email || row.user.id }}</small></div
            ></template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.common.date')" width="130"
          ><template #default="{ row }">{{
            formatDate(row.statDate, locale)
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.heartRate.average')" width="110"
          ><template #default="{ row }"
            ><strong>{{ row.avgHeartRate ?? '—' }}</strong> bpm</template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.heartRate.range')" width="130"
          ><template #default="{ row }"
            >{{ row.minHeartRate ?? '—' }}–{{ row.maxHeartRate ?? '—' }} bpm</template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.heartRate.resting')" width="110"
          ><template #default="{ row }">{{ row.restingHeartRate ?? '—' }}</template></ElTableColumn
        >
        <ElTableColumn prop="sampleCount" :label="t('wellness.heartRate.samples')" width="110" />
        <ElTableColumn :label="t('wellness.common.quality')" width="110"
          ><template #default="{ row }"
            ><ElTag :type="qualityTagType(row.dataQuality)">{{
              t(`wellness.quality.${row.dataQuality}`)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.common.actions')" width="90" fixed="right"
          ><template #default="{ row }"
            ><ElButton link type="primary" @click="openDetail(row.id)">{{
              t('wellness.common.detail')
            }}</ElButton></template
          ></ElTableColumn
        >
      </ArtTable>
    </ElCard>
    <ElDrawer v-model="drawerVisible" :title="t('wellness.heartRate.detailTitle')" size="680px">
      <template v-if="detail">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="t('wellness.common.user')">{{
            detail.summary.user.name
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.common.date')">{{
            formatDate(detail.summary.statDate, locale)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.heartRate.average')"
            >{{ detail.summary.avgHeartRate ?? '—' }} bpm</ElDescriptionsItem
          >
          <ElDescriptionsItem :label="t('wellness.heartRate.resting')"
            >{{ detail.summary.restingHeartRate ?? '—' }} bpm</ElDescriptionsItem
          >
          <ElDescriptionsItem :label="t('wellness.heartRate.hrv')"
            >{{ detail.summary.hrvMs ?? '—' }} ms</ElDescriptionsItem
          >
          <ElDescriptionsItem :label="t('wellness.common.device')">{{
            detail.summary.primaryDeviceSerial || '—'
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="detail-section"
          ><h3>{{ t('wellness.heartRate.latestSamples', { count: detail.samples.length }) }}</h3>
          <ElTable :data="detail.samples" size="small" max-height="430">
            <ElTableColumn :label="t('wellness.common.time')" min-width="180"
              ><template #default="{ row }">{{
                formatDateTime(row.measuredAt, locale)
              }}</template></ElTableColumn
            >
            <ElTableColumn prop="bpm" label="BPM" width="90" />
            <ElTableColumn :label="t('wellness.heartRate.context')" width="120"
              ><template #default="{ row }">{{
                t(`wellness.context.${row.context}`)
              }}</template></ElTableColumn
            >
            <ElTableColumn
              prop="deviceSerial"
              :label="t('wellness.common.device')"
              min-width="150"
              show-overflow-tooltip
            />
          </ElTable>
        </div>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import {
    fetchHeartRateDetail,
    fetchHeartRateRecords,
    type HeartRateDetail,
    type HeartRateItem,
    type HeartRateStats
  } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'
  import { formatDate, formatDateTime, qualityTagType } from '../shared'

  defineOptions({ name: 'WellnessHeartRate' })
  const { t, locale } = useI18n()
  const contexts = ['continuous', 'manual', 'workout', 'sleep'],
    qualityOptions = ['normal', 'partial', 'missing']
  const loading = ref(false),
    drawerVisible = ref(false)
  const items = ref<HeartRateItem[]>([]),
    detail = ref<HeartRateDetail>()
  const stats = ref<HeartRateStats>({
    recordCount: 0,
    userCount: 0,
    averageHeartRate: 0,
    averageRestingRate: 0
  })
  const pagination = reactive({ current: 1, size: 20, total: 0 })
  const filters = reactive<{
    keyword: string
    dates: string[]
    context: string
    dataQuality: string
  }>({ keyword: '', dates: [], context: '', dataQuality: '' })
  const statCards = computed(() => [
    { label: t('wellness.common.records'), value: stats.value.recordCount },
    { label: t('wellness.common.users'), value: stats.value.userCount },
    {
      label: t('wellness.heartRate.average'),
      value: `${stats.value.averageHeartRate.toFixed(1)} bpm`
    },
    {
      label: t('wellness.heartRate.averageResting'),
      value: `${stats.value.averageRestingRate.toFixed(1)} bpm`
    }
  ])
  const load = async () => {
    loading.value = true
    try {
      const response = await fetchHeartRateRecords({
        page: pagination.current,
        pageSize: pagination.size,
        keyword: filters.keyword || undefined,
        startDate: filters.dates?.[0],
        endDate: filters.dates?.[1],
        context: filters.context || undefined,
        dataQuality: filters.dataQuality || undefined
      })
      items.value = response.items
      pagination.total = response.total
      stats.value = response.stats
    } finally {
      loading.value = false
    }
  }
  const search = () => {
    pagination.current = 1
    load()
  }
  const reset = () => {
    Object.assign(filters, { keyword: '', dates: [], context: '', dataQuality: '' })
    search()
  }
  const changePage = (page: number) => {
    pagination.current = page
    load()
  }
  const changeSize = (size: number) => {
    pagination.size = size
    pagination.current = 1
    load()
  }
  const openDetail = async (id: string) => {
    detail.value = await fetchHeartRateDetail(id)
    drawerVisible.value = true
  }
  load()
</script>

<style scoped lang="scss">
  @use '../shared';
</style>
