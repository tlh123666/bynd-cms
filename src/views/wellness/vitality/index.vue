<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading"
      ><div
        ><h1>{{ t('wellness.vitality.title') }}</h1
        ><p>{{ t('wellness.vitality.subtitle') }}</p></div
      ></div
    >
    <StatCards :items="statCards" />
    <ElAlert :title="t('wellness.vitality.notice')" type="info" :closable="false" show-icon />
    <ArtSearchBar
      v-show="showSearchBar"
      v-model="searchForm"
      :items="searchItems"
      :show-expand="false"
      @search="handleSearch"
      @reset="resetSearchParams"
    />
    <ElCard class="wellness-card art-table-card" shadow="never">
      <ArtTableHeader
        v-model:show-search-bar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      />
      <ArtTable
        :loading="loading"
        :data="data"
        :pagination="pagination"
        :row-key="rowKey"
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
        <ElTableColumn :label="t('wellness.vitality.kind')" width="110"
          ><template #default="{ row }"
            ><ElTag>{{ t(`wellness.vitality.${row.kind}`) }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.vitality.observedAt')" min-width="200"
          ><template #default="{ row }">{{
            formatDateTime(row.observedAt, locale, 'UTC')
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.vitality.score')" width="110"
          ><template #default="{ row }">{{ number(row.score) }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.experience.fields.considerTraining')" min-width="150"
          ><template #default="{ row }">{{
            t(`wellness.experience.${row.considerTraining ? 'yes' : 'no'}`)
          }}</template></ElTableColumn
        >
        <ElTableColumn
          prop="algorithmVersion"
          :label="t('wellness.experience.fields.algorithmVersion')"
          width="130"
        />
        <ElTableColumn :label="t('wellness.common.actions')" width="110" fixed="right"
          ><template #default="{ row }"
            ><ElButton link type="primary" @click="showObservation(row)">{{
              t('wellness.common.detail')
            }}</ElButton></template
          ></ElTableColumn
        >
      </ArtTable>
    </ElCard>
    <WellnessDetailDrawer
      v-model="drawerVisible"
      :title="t('wellness.vitality.detailTitle')"
      :loading="detailLoading"
      :error="detailError"
      @retry="retryDetail"
    >
      <template v-if="detail">
        <ElDescriptions :column="1" border
          ><ElDescriptionsItem :label="t('wellness.common.user')"
            >{{ detail.user.name }} ({{ detail.user.id }})</ElDescriptionsItem
          ></ElDescriptions
        >
        <WellnessDetails :value="selectedObservation" :title="t('wellness.vitality.observation')" />
        <WellnessDetails
          :value="detail.preferences"
          :title="t('wellness.experience.vitalityPreferences')"
        />
        <ElAlert :title="t('wellness.vitality.preferenceNotice')" type="info" :closable="false" />
      </template>
    </WellnessDetailDrawer>
  </div>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchVitalityRecords,
    fetchVitalityDetail,
    type VitalityItem,
    type VitalityStats,
    type WellnessListParams
  } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'
  import WellnessDetails from '../components/WellnessDetails.vue'
  import WellnessDetailDrawer from '../components/WellnessDetailDrawer.vue'
  import { useWellnessDetail } from '../useWellnessDetail'
  import { formatDateTime } from '../shared'
  defineOptions({ name: 'WellnessVitality' })
  const { t, locale } = useI18n()
  const showSearchBar = ref(true)
  const searchForm = ref({
    keyword: '',
    dates: [] as string[],
    kind: '',
    training: '',
    algorithmVersion: ''
  })
  const stats = ref<VitalityStats>({
    recordCount: 0,
    userCount: 0,
    averageRecovery: null,
    averageEnergy: null
  })
  const number = (value: number | null) =>
    value == null
      ? '—'
      : new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value)
  const statCards = computed(() => [
    { label: t('wellness.common.records'), value: stats.value.recordCount },
    { label: t('wellness.common.users'), value: stats.value.userCount },
    { label: t('wellness.vitality.averageRecovery'), value: number(stats.value.averageRecovery) },
    { label: t('wellness.vitality.averageEnergy'), value: number(stats.value.averageEnergy) }
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
      label: t('wellness.vitality.kind'),
      key: 'kind',
      type: 'select',
      props: {
        clearable: true,
        options: ['recovery', 'energy'].map((value) => ({
          value,
          label: t(`wellness.vitality.${value}`)
        }))
      }
    },
    {
      label: t('wellness.experience.fields.considerTraining'),
      key: 'training',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { value: 'true', label: t('wellness.experience.yes') },
          { value: 'false', label: t('wellness.experience.no') }
        ]
      }
    },
    {
      label: t('wellness.experience.fields.algorithmVersion'),
      key: 'algorithmVersion',
      type: 'input',
      props: { clearable: true, type: 'number', min: 1, step: 1 }
    }
  ])
  const fetchTableData = async (params: WellnessListParams) => {
    const response = await fetchVitalityRecords(params)
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
    const { dates, training, algorithmVersion, ...filters } = params
    replaceSearchParams({
      ...filters,
      startDate: dates?.[0],
      endDate: dates?.[1],
      considerTraining: training === '' || training == null ? undefined : training === 'true',
      algorithmVersion:
        algorithmVersion === '' || algorithmVersion == null ? undefined : Number(algorithmVersion)
    })
    getData()
  }
  const rowKey = (row: VitalityItem) =>
    JSON.stringify([
      row.user.id,
      row.kind,
      row.observedAt,
      row.considerTraining,
      row.algorithmVersion
    ])
  const { drawerVisible, detailLoading, detailError, detail, openDetail, retryDetail } =
    useWellnessDetail(fetchVitalityDetail)
  const selectedRow = ref<VitalityItem>()
  const selectedObservation = computed(() => {
    const row = selectedRow.value
    return row
      ? {
          kind: t(`wellness.vitality.${row.kind}`),
          observedAt: `${formatDateTime(row.observedAt, locale.value, 'UTC')} UTC`,
          score: row.score,
          considerTraining: row.considerTraining,
          algorithmVersion: row.algorithmVersion
        }
      : undefined
  })
  const showObservation = (row: VitalityItem) => {
    selectedRow.value = row
    openDetail(row.user.id)
  }
</script>
<style scoped lang="scss">
  @use '../shared';
  .el-alert {
    margin-bottom: 16px;
  }
</style>
