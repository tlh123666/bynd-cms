<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading">
      <div>
        <p class="eyebrow">SLEEP</p>
        <h1>{{ t('wellness.sleep.title') }}</h1>
        <p>{{ t('wellness.sleep.subtitle') }}</p>
      </div>
    </div>

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
        <ElTableColumn :label="t('wellness.common.user')" min-width="210">
          <template #default="{ row }"
            ><div class="user-cell"
              ><strong>{{ row.user.name }}</strong
              ><small>{{ row.user.email || row.user.id }}</small></div
            ></template
          >
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.common.date')" width="130"
          ><template #default="{ row }">{{
            formatDate(row.statDate, locale)
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.sleep.duration')" width="150"
          ><template #default="{ row }">{{
            formatDuration(row.sleepMinutes, t)
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.sleep.score')" width="100"
          ><template #default="{ row }"
            ><ElTag :type="scoreType(row.sleepScore)">{{
              row.sleepScore == null ? '—' : row.sleepScore.toFixed(0)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.sleep.stages')" min-width="190"
          ><template #default="{ row }">{{
            t('wellness.sleep.stageValue', { deep: row.deepSleepMinutes, rem: row.remSleepMinutes })
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.sleep.efficiency')" width="110"
          ><template #default="{ row }">{{
            row.efficiencyPercent == null ? '—' : `${row.efficiencyPercent.toFixed(1)}%`
          }}</template></ElTableColumn
        >
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

    <ElDrawer v-model="drawerVisible" :title="t('wellness.sleep.detailTitle')" size="620px">
      <template v-if="detail">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="t('wellness.common.user')">{{
            detail.summary.user.name
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.common.date')">{{
            formatDate(detail.summary.statDate, locale)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.sleep.duration')">{{
            formatDuration(detail.summary.sleepMinutes, t)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.sleep.score')">{{
            detail.summary.sleepScore ?? '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.sleep.averageHeartRate')">{{
            detail.summary.avgHeartRate ?? '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.sleep.spo2')">{{
            detail.summary.avgSpo2Percent == null ? '—' : `${detail.summary.avgSpo2Percent}%`
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="detail-section"
          ><h3>{{ t('wellness.sleep.sessions') }}</h3>
          <ElTable :data="detail.sessions" size="small">
            <ElTableColumn :label="t('wellness.sleep.sessionType')" width="100"
              ><template #default="{ row }">{{
                t(`wellness.sleep.${row.sessionType}`)
              }}</template></ElTableColumn
            >
            <ElTableColumn :label="t('wellness.sleep.startedAt')" min-width="170"
              ><template #default="{ row }">{{
                formatDateTime(row.startAt, locale)
              }}</template></ElTableColumn
            >
            <ElTableColumn :label="t('wellness.sleep.duration')" min-width="130"
              ><template #default="{ row }">{{
                formatDuration(row.asleepMinutes, t)
              }}</template></ElTableColumn
            >
            <ElTableColumn prop="wakeCount" :label="t('wellness.sleep.wakeCount')" width="90" />
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
    fetchSleepDetail,
    fetchSleepRecords,
    type SleepDetail,
    type SleepStats,
    type WellnessListParams
  } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'
  import { formatDate, formatDateTime, formatDuration, qualityTagType } from '../shared'

  defineOptions({ name: 'WellnessSleep' })
  const { t, locale } = useI18n()
  const qualityOptions = ['normal', 'partial', 'missing']
  const drawerVisible = ref(false)
  const detail = ref<SleepDetail>()
  const stats = ref<SleepStats>({
    recordCount: 0,
    userCount: 0,
    averageSleepHours: 0,
    averageScore: 0
  })
  const searchForm = ref<{
    keyword: string
    dates: string[]
    sessionType: string
    dataQuality: string
  }>({ keyword: '', dates: [], sessionType: '', dataQuality: '' })
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
      label: t('wellness.sleep.sessionType'),
      key: 'sessionType',
      type: 'select',
      props: {
        clearable: true,
        placeholder: t('wellness.sleep.sessionType'),
        options: [
          { label: t('wellness.sleep.night'), value: 'night' },
          { label: t('wellness.sleep.nap'), value: 'nap' }
        ]
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
  const statCards = computed(() => [
    { label: t('wellness.common.records'), value: stats.value.recordCount },
    { label: t('wellness.common.users'), value: stats.value.userCount },
    {
      label: t('wellness.sleep.averageDuration'),
      value: `${stats.value.averageSleepHours.toFixed(1)} h`
    },
    { label: t('wellness.sleep.averageScore'), value: stats.value.averageScore.toFixed(1) }
  ])
  const fetchTableData = async (params: WellnessListParams) => {
    const response = await fetchSleepRecords(params)
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
    detail.value = await fetchSleepDetail(id)
    drawerVisible.value = true
  }
  const scoreType = (score?: number) =>
    score == null ? 'info' : score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'
</script>

<style scoped lang="scss">
  @use '../shared';

  .table-card-with-search {
    margin-top: 12px;
  }
</style>
