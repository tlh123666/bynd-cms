<template>
  <div class="wellness-page art-full-height diary-dashboard">
    <div class="wellness-heading dashboard-heading">
      <div>
        <p class="eyebrow">DIARY ANALYTICS</p>
        <h1>{{ t('wellness.diaryDashboard.title') }}</h1>
        <p>{{ t('wellness.diaryDashboard.subtitle') }}</p>
      </div>
      <div class="dashboard-filter">
        <ElDatePicker
          v-model="dates"
          type="daterange"
          value-format="YYYY-MM-DD"
          :start-placeholder="t('wellness.common.startDate')"
          :end-placeholder="t('wellness.common.endDate')"
          :clearable="false"
        />
        <ElButton type="primary" :loading="loading" @click="load">
          {{ t('wellness.diaryDashboard.apply') }}
        </ElButton>
      </div>
    </div>

    <StatCards :items="statCards" />

    <div class="dashboard-grid">
      <ElCard class="chart-card trend-card" shadow="never">
        <template #header>
          <div class="chart-heading">
            <div>
              <h3>{{ t('wellness.diaryDashboard.trendTitle') }}</h3>
              <p>{{ t('wellness.diaryDashboard.trendSubtitle') }}</p>
            </div>
          </div>
        </template>
        <ArtLineChart
          height="320px"
          :loading="loading"
          :is-empty="!dashboard.dailyTrend.length"
          :data="trendSeries"
          :x-axis-data="trendDates"
          :show-area-color="true"
          :show-axis-line="false"
          :show-legend="true"
        />
      </ElCard>

      <ElCard class="chart-card" shadow="never">
        <template #header>
          <div class="chart-heading">
            <h3>{{ t('wellness.diaryDashboard.statusTitle') }}</h3>
          </div>
        </template>
        <ArtRingChart
          height="320px"
          :loading="loading"
          :is-empty="!dashboard.statusDistribution.length"
          :data="statusData"
          :center-text="String(dashboard.summary.recordCount)"
          :show-legend="true"
          legend-position="bottom"
        />
      </ElCard>

      <ElCard class="chart-card wide-card" shadow="never">
        <template #header>
          <div class="chart-heading">
            <div>
              <h3>{{ t('wellness.diaryDashboard.contextTitle') }}</h3>
              <p>{{ t('wellness.diaryDashboard.contextSubtitle') }}</p>
            </div>
          </div>
        </template>
        <ArtBarChart
          height="310px"
          :loading="loading"
          :is-empty="!dashboard.contextDistribution.length"
          :data="contextValues"
          :x-axis-data="contextNames"
          :show-axis-line="false"
          bar-width="42%"
        />
      </ElCard>

      <ElCard class="chart-card" shadow="never">
        <template #header>
          <div class="chart-heading">
            <h3>{{ t('wellness.diaryDashboard.inputTitle') }}</h3>
          </div>
        </template>
        <ArtRingChart
          height="310px"
          :loading="loading"
          :is-empty="!dashboard.inputDistribution.length"
          :data="inputData"
          :show-legend="true"
          legend-position="bottom"
        />
      </ElCard>

      <ElCard class="chart-card" shadow="never">
        <template #header>
          <div class="chart-heading">
            <h3>{{ t('wellness.diaryDashboard.modelTitle') }}</h3>
          </div>
        </template>
        <div v-loading="loading" class="dimension-list">
          <div v-for="item in dashboard.modelDistribution" :key="item.name" class="dimension-row">
            <div>
              <strong>{{ modelLabel(item.name) }}</strong>
              <span>{{ item.value }}</span>
            </div>
            <ElProgress
              :percentage="dimensionPercent(item.value, modelTotal)"
              :show-text="false"
              :stroke-width="8"
            />
          </div>
          <ElEmpty
            v-if="!loading && !dashboard.modelDistribution.length"
            :description="t('wellness.diaryDashboard.noData')"
            :image-size="72"
          />
        </div>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fetchDiaryDashboard, type DiaryDashboard } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'

  defineOptions({ name: 'WellnessDiaryDashboard' })

  const { t, locale } = useI18n()
  const loading = ref(false)

  const dateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
  const dates = ref([dateKey(thirtyDaysAgo), dateKey(today)])

  const emptyDashboard = (): DiaryDashboard => ({
    startDate: dates.value[0],
    endDate: dates.value[1],
    summary: {
      recordCount: 0,
      userCount: 0,
      readyCount: 0,
      contextDiaryCount: 0,
      readyRate: 0,
      contextCoverage: 0
    },
    dailyTrend: [],
    statusDistribution: [],
    contextDistribution: [],
    inputDistribution: [],
    modelDistribution: []
  })
  const dashboard = ref<DiaryDashboard>(emptyDashboard())

  const statCards = computed(() => [
    {
      label: t('wellness.diaryDashboard.totalDiaries'),
      value: dashboard.value.summary.recordCount
    },
    { label: t('wellness.diaryDashboard.activeUsers'), value: dashboard.value.summary.userCount },
    {
      label: t('wellness.diaryDashboard.readyRate'),
      value: `${dashboard.value.summary.readyRate.toFixed(1)}%`
    },
    {
      label: t('wellness.diaryDashboard.contextCoverage'),
      value: `${dashboard.value.summary.contextCoverage.toFixed(1)}%`
    }
  ])

  const trendDates = computed(() =>
    dashboard.value.dailyTrend.map((item) =>
      new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric'
      }).format(new Date(`${item.date}T00:00:00`))
    )
  )
  const trendSeries = computed(() => [
    {
      name: t('wellness.diaryDashboard.diaries'),
      data: dashboard.value.dailyTrend.map((item) => item.diaryCount),
      color: '#5B8FF9',
      showAreaColor: true
    },
    {
      name: t('wellness.diaryDashboard.readyStories'),
      data: dashboard.value.dailyTrend.map((item) => item.readyCount),
      color: '#5AD8A6'
    },
    {
      name: t('wellness.diaryDashboard.withContext'),
      data: dashboard.value.dailyTrend.map((item) => item.contextCount),
      color: '#F6BD16'
    }
  ])
  const statusData = computed(() =>
    dashboard.value.statusDistribution.map((item) => ({
      name: t(`wellness.diaries.status.${item.name}`),
      value: item.value
    }))
  )
  const topContexts = computed(() => dashboard.value.contextDistribution.slice(0, 10))
  const contextNames = computed(() => topContexts.value.map((item) => contextLabel(item.name)))
  const contextValues = computed(() => topContexts.value.map((item) => item.value))
  const inputData = computed(() =>
    dashboard.value.inputDistribution.map((item) => ({
      name: t(`wellness.diaries.input.${item.name}`),
      value: item.value
    }))
  )
  const modelTotal = computed(() =>
    dashboard.value.modelDistribution.reduce((total, item) => total + item.value, 0)
  )

  const contextLabel = (kind: string) => t(`wellness.diaries.context.${kind}`)
  const modelLabel = (model: string) =>
    model === 'unknown' ? t('wellness.diaryDashboard.unknownModel') : model
  const dimensionPercent = (value: number, total: number) =>
    total ? Math.round((value / total) * 100) : 0

  const load = async () => {
    loading.value = true
    try {
      dashboard.value = await fetchDiaryDashboard({
        startDate: dates.value[0],
        endDate: dates.value[1]
      })
    } finally {
      loading.value = false
    }
  }

  load()
</script>

<style scoped lang="scss">
  @use '../shared';

  .dashboard-heading {
    gap: 20px;
  }

  .dashboard-filter {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .chart-card {
    min-width: 0;
    border-radius: 14px;
  }

  .trend-card,
  .wide-card {
    grid-column: span 2;
  }

  .chart-heading {
    h3,
    p {
      margin: 0;
    }

    h3 {
      font-size: 16px;
    }

    p {
      margin-top: 5px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .dimension-list {
    min-height: 310px;
  }

  .dimension-row {
    margin-bottom: 22px;

    > div:first-child {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      span {
        color: var(--el-text-color-secondary);
      }
    }
  }

  @media (width <= 900px) {
    .dashboard-heading,
    .dashboard-filter {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .trend-card,
    .wide-card {
      grid-column: span 1;
    }
  }
</style>
