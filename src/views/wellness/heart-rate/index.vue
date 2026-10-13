<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading"
      ><div
        ><p class="eyebrow">HEART RATE</p><h1>{{ t('wellness.heartRate.title') }}</h1
        ><p>{{ t('wellness.heartRate.subtitle') }}</p></div
      ></div
    >
    <StatCards :items="statCards" />

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="wellness-card art-table-card table-card-with-search" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="refreshData" />
      <ArtTable
        :loading="loading"
        :data="data"
        :pagination="pagination"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
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
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchHeartRateDetail,
    fetchHeartRateRecords,
    type HeartRateDetail,
    type HeartRateStats,
    type WellnessListParams
  } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'
  import { formatDate, formatDateTime, qualityTagType } from '../shared'

  defineOptions({ name: 'WellnessHeartRate' })
  const { t, locale } = useI18n()
  const contexts = ['continuous', 'manual', 'workout', 'sleep'],
    qualityOptions = ['normal', 'partial', 'missing']
  const drawerVisible = ref(false)
  const detail = ref<HeartRateDetail>()
  const stats = ref<HeartRateStats>({
    recordCount: 0,
    userCount: 0,
    averageHeartRate: 0,
    averageRestingRate: 0
  })
  const searchForm = ref<{
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
  const searchItems = computed(() => [
    {
      label: t('wellness.common.user'),
      key: 'keyword',
      type: 'input',
      props: { clearable: true, placeholder: t('wellness.common.userSearch') }
    },
    {
      label: t('wellness.common.date'),
      key: 'dates',
      type: 'daterange',
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: t('wellness.common.startDate'),
        endPlaceholder: t('wellness.common.endDate')
      }
    },
    {
      label: t('wellness.heartRate.context'),
      key: 'context',
      type: 'select',
      props: {
        clearable: true,
        placeholder: t('wellness.heartRate.context'),
        options: contexts.map((item) => ({
          label: t(`wellness.context.${item}`),
          value: item
        }))
      }
    },
    {
      label: t('wellness.common.quality'),
      key: 'dataQuality',
      type: 'select',
      props: {
        clearable: true,
        placeholder: t('wellness.common.quality'),
        options: qualityOptions.map((item) => ({
          label: t(`wellness.quality.${item}`),
          value: item
        }))
      }
    }
  ])

  const fetchTableData = async (params: WellnessListParams) => {
    const response = await fetchHeartRateRecords(params)
    stats.value = response.stats
    return response
  }

  const {
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    refreshData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchTableData,
      apiParams: { page: 1, pageSize: 20 },
      paginationKey: { current: 'page', size: 'pageSize' }
    }
  })

  const handleSearch = (params: Record<string, any>) => {
    const { dates, ...filters } = params
    replaceSearchParams({
      ...filters,
      startDate: dates?.[0],
      endDate: dates?.[1]
    })
    getData()
  }
  const handleReset = () => resetSearchParams()
  const openDetail = async (id: string) => {
    detail.value = await fetchHeartRateDetail(id)
    drawerVisible.value = true
  }
</script>

<style scoped lang="scss">
  @use '../shared';

  .table-card-with-search {
    margin-top: 12px;
  }
</style>
