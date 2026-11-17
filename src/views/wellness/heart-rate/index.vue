<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading"
      ><div
        ><p class="eyebrow">{{ t('wellness.heartRate.title') }}</p
        ><h1>{{ t('wellness.heartRate.title') }}</h1
        ><p>{{ t('wellness.heartRate.subtitle') }}</p></div
      ></div
    >
    <ElTabs v-model="activeTab" @tab-change="drawerVisible = false">
      <ElTabPane :label="t('wellness.experience.dailySummaries')" name="summaries" />
      <ElTabPane :label="t('wellness.experience.measurements')" name="measurements" />
    </ElTabs>
    <template v-if="activeTab === 'summaries'">
      <StatCards :items="statCards" />

      <ArtSearchBar
        v-show="showSearchBar"
        v-model="searchForm"
        :items="searchItems"
        :show-expand="false"
        @search="handleSearch"
        @reset="handleReset"
      />

      <ElCard class="wellness-card art-table-card table-card-with-search" shadow="never">
        <ArtTableHeader
          v-model:show-search-bar="showSearchBar"
          :loading="loading"
          @refresh="refreshData"
        />
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
            ><template #default="{ row }">{{
              row.restingHeartRate ?? '—'
            }}</template></ElTableColumn
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
      <WellnessDetailDrawer
        v-model="drawerVisible"
        :title="t('wellness.heartRate.detailTitle')"
        :loading="detailLoading"
        :error="detailError"
        @retry="retryDetail"
      >
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
          <WellnessDetails
            :value="detail.settings"
            :title="t('wellness.experience.heartSettings')"
          />
          <section class="detail-section">
            <h3>{{ t('wellness.experience.measurements') }}</h3>
            <ElAlert
              :title="t('wellness.experience.measurementNotice')"
              type="info"
              :closable="false"
            />
            <p>{{
              t('wellness.experience.shownRecords', {
                shown: detail.measurements.length,
                total: detail.measurementTotal
              })
            }}</p>
            <ElTable :data="detail.measurements" size="small" max-height="400" row-key="id">
              <ElTableColumn type="expand"
                ><template #default="{ row }"
                  ><WellnessDetails
                    :value="{
                      measurementContext: row.measurementContext,
                      symptoms: row.symptoms,
                      durationMillis: row.durationMillis,
                      sampleCount: row.sampleCount,
                      deviceSerial: row.deviceSerial,
                      source: row.source
                    }" /></template
              ></ElTableColumn>
              <ElTableColumn :label="t('wellness.common.time')" min-width="180"
                ><template #default="{ row }">{{
                  formatDateTime(row.measuredAt, locale)
                }}</template></ElTableColumn
              >
              <ElTableColumn :label="t('wellness.experience.fields.waveformKind')" min-width="150"
                ><template #default="{ row }">{{
                  ['ecg', 'ppg', 'unknown'].includes(row.waveformKind)
                    ? t(`wellness.experience.values.${row.waveformKind}`)
                    : t('wellness.experience.values.unknown')
                }}</template></ElTableColumn
              >
              <ElTableColumn prop="heartRate" :label="t('wellness.heartRate.average')" width="100"
                ><template #default="{ row }">{{ row.heartRate ?? '—' }}</template></ElTableColumn
              >
            </ElTable>
          </section>
          <div class="detail-section"
            ><h3>{{ t('wellness.heartRate.latestSamples', { count: detail.samples.length }) }}</h3>
            <p>{{
              t('wellness.experience.shownRecords', {
                shown: detail.samples.length,
                total: detail.sampleTotal
              })
            }}</p>
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
      </WellnessDetailDrawer>
    </template>
    <HeartMeasurements v-else />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchHeartRateDetail,
    fetchHeartRateRecords,
    type HeartRateStats,
    type WellnessListParams
  } from '@/api/wellness'
  import HeartMeasurements from '../components/HeartMeasurements.vue'
  import StatCards from '../components/StatCards.vue'
  import WellnessDetails from '../components/WellnessDetails.vue'
  import WellnessDetailDrawer from '../components/WellnessDetailDrawer.vue'
  import { useWellnessDetail } from '../useWellnessDetail'
  import { formatDate, formatDateTime, qualityTagType } from '../shared'

  defineOptions({ name: 'WellnessHeartRate' })
  const { t, locale } = useI18n()
  const contexts = ['continuous', 'manual', 'workout', 'sleep'],
    qualityOptions = ['normal', 'partial', 'missing']
  const activeTab = ref('summaries')
  const showSearchBar = ref(true)
  const { drawerVisible, detailLoading, detailError, detail, openDetail, retryDetail } =
    useWellnessDetail(fetchHeartRateDetail)
  const stats = ref<HeartRateStats>({
    recordCount: 0,
    userCount: 0,
    averageHeartRate: null,
    averageRestingRate: null
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
      value:
        stats.value.averageHeartRate == null
          ? '—'
          : `${stats.value.averageHeartRate.toFixed(1)} bpm`
    },
    {
      label: t('wellness.heartRate.averageResting'),
      value:
        stats.value.averageRestingRate == null
          ? '—'
          : `${stats.value.averageRestingRate.toFixed(1)} bpm`
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
</script>

<style scoped lang="scss">
  @use '../shared';

  .table-card-with-search {
    margin-top: 12px;
  }
</style>
