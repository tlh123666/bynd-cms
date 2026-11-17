<template>
  <div>
    <StatCards :items="statCards" />
    <ElAlert :title="t('wellness.experience.measurementNotice')" type="info" :closable="false" />
    <ArtSearchBar
      v-show="showSearchBar"
      v-model="searchForm"
      :items="searchItems"
      :show-expand="false"
      @search="handleSearch"
      @reset="resetSearchParams"
    />
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader
        v-model:show-search-bar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      />
      <ArtTable
        :data="data"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <ElTableColumn type="expand"
          ><template #default="{ row }"
            ><WellnessDetails
              :value="{
                measurementContext: row.measurementContext,
                symptoms: row.symptoms,
                durationMillis: row.durationMillis,
                sampleCount: row.sampleCount,
                source: row.source,
                deviceSerial: row.deviceSerial
              }" /></template
        ></ElTableColumn>
        <ElTableColumn :label="t('wellness.common.user')" min-width="200"
          ><template #default="{ row }"
            ><div class="user-cell"
              ><strong>{{ row.user.name }}</strong
              ><small>{{ row.user.email || row.user.id }}</small></div
            ></template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.experience.measuredAtUTC')" min-width="200"
          ><template #default="{ row }">{{
            formatDateTime(row.measuredAt, locale, 'UTC')
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.experience.fields.waveformKind')" min-width="150"
          ><template #default="{ row }">{{ typeLabel(row.waveformKind) }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.heartRate.average')" width="130"
          ><template #default="{ row }">{{ row.heartRate ?? '—' }} bpm</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.heartRate.hrv')" width="120"
          ><template #default="{ row }">{{ row.hrvMs ?? '—' }} ms</template></ElTableColumn
        >
      </ArtTable>
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchHeartMeasurements,
    type HeartMeasurementStats,
    type WellnessListParams
  } from '@/api/wellness'
  import StatCards from './StatCards.vue'
  import WellnessDetails from './WellnessDetails.vue'
  import { formatDateTime } from '../shared'
  const { t, locale } = useI18n()
  const showSearchBar = ref(true)
  const searchForm = ref({
    keyword: '',
    dates: [] as string[],
    waveformKind: '',
    measurementContext: ''
  })
  const stats = ref<HeartMeasurementStats>({
    recordCount: 0,
    userCount: 0,
    ppgCount: 0,
    ecgCount: 0
  })
  const typeLabel = (kind: string) =>
    t(`wellness.experience.values.${['ppg', 'ecg', 'unknown'].includes(kind) ? kind : 'unknown'}`)
  const statCards = computed(() => [
    { label: t('wellness.common.records'), value: stats.value.recordCount },
    { label: t('wellness.common.users'), value: stats.value.userCount },
    { label: typeLabel('ppg'), value: stats.value.ppgCount },
    { label: typeLabel('ecg'), value: stats.value.ecgCount }
  ])
  const searchItems = computed(() => [
    {
      label: t('wellness.common.user'),
      key: 'keyword',
      type: 'input',
      props: { clearable: true, placeholder: t('wellness.common.userSearch') }
    },
    {
      label: t('wellness.vitality.utcDate'),
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
      label: t('wellness.experience.fields.waveformKind'),
      key: 'waveformKind',
      type: 'select',
      props: {
        clearable: true,
        options: ['ppg', 'ecg', 'unknown'].map((value) => ({ value, label: typeLabel(value) }))
      }
    },
    {
      label: t('wellness.experience.fields.measurementContext'),
      key: 'measurementContext',
      type: 'select',
      props: {
        clearable: true,
        options: ['rest', 'after_coffee', 'after_workout'].map((value) => ({
          value,
          label: t(`wellness.experience.values.${value}`)
        }))
      }
    }
  ])
  const fetchTableData = async (params: WellnessListParams) => {
    const response = await fetchHeartMeasurements(params)
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
    replaceSearchParams({ ...filters, startDate: dates?.[0], endDate: dates?.[1] })
    getData()
  }
</script>
<style scoped lang="scss">
  @use '../shared';
  .el-alert {
    margin-bottom: 16px;
  }
</style>
