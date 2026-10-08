<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading">
      <div>
        <p class="eyebrow">BODY DIARIES</p>
        <h1>{{ t('wellness.diaries.title') }}</h1>
        <p>{{ t('wellness.diaries.subtitle') }}</p>
      </div>
    </div>

    <StatCards :items="statCards" />

    <ElCard class="wellness-card art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="load">
        <template #left>
          <div class="wellness-search">
            <ElInput
              v-model="filters.keyword"
              class="keyword"
              clearable
              :placeholder="t('wellness.diaries.searchPlaceholder')"
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
              v-model="filters.storyStatus"
              class="select-filter"
              clearable
              :placeholder="t('wellness.diaries.storyStatus')"
            >
              <ElOption
                v-for="status in storyStatuses"
                :key="status"
                :label="statusLabel(status)"
                :value="status"
              />
            </ElSelect>
            <ElSelect
              v-model="filters.contextKind"
              class="select-filter"
              clearable
              filterable
              :placeholder="t('wellness.diaries.contextKind')"
            >
              <ElOption
                v-for="kind in contextKinds"
                :key="kind"
                :label="contextLabel(kind)"
                :value="kind"
              />
            </ElSelect>
            <ElButton type="primary" @click="search">{{ t('table.searchBar.search') }}</ElButton>
            <ElButton @click="reset">{{ t('table.searchBar.reset') }}</ElButton>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="items"
        :pagination="pagination"
        row-key="id"
        @pagination:size-change="changeSize"
        @pagination:current-change="changePage"
      >
        <ElTableColumn :label="t('wellness.common.user')" min-width="210">
          <template #default="{ row }">
            <div class="user-cell">
              <strong>{{ row.user.name }}</strong>
              <small>{{ row.user.email || row.user.id }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.common.date')" width="130">
          <template #default="{ row }">{{ formatDate(row.statDate, locale) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.diaries.story')" min-width="250">
          <template #default="{ row }">
            <div class="story-cell">
              <strong>{{ row.title || t('wellness.diaries.untitled') }}</strong>
              <small>{{ row.bodyPreview || t('wellness.diaries.noStory') }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.diaries.storyStatus')" width="110">
          <template #default="{ row }">
            <ElTag :type="statusType(row.storyStatus)" effect="light">
              {{ statusLabel(row.storyStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.diaries.contextSignals')" width="140">
          <template #default="{ row }">
            {{ row.contextCount + row.eventCount }}
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.diaries.model')" width="150">
          <template #default="{ row }">{{ row.storyModel || '—' }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.common.updatedAt')" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt, locale) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('wellness.common.actions')" width="90" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetail(row.id)">
              {{ t('wellness.common.detail') }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ArtTable>
    </ElCard>

    <ElDrawer v-model="drawerVisible" :title="t('wellness.diaries.detailTitle')" size="680px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem :label="t('wellness.common.user')">
              {{ detail.user.name }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('wellness.common.date')">
              {{ formatDate(detail.statDate, locale) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('wellness.diaries.storyStatus')">
              <ElTag :type="statusType(detail.storyStatus)">
                {{ statusLabel(detail.storyStatus) }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('wellness.diaries.model')">
              {{ detail.storyModel || '—' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('wellness.common.timezone')">
              {{ detail.timezone }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('wellness.diaries.generatedAt')">
              {{ detail.storyGeneratedAt ? formatDateTime(detail.storyGeneratedAt, locale) : '—' }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <section class="detail-section">
            <h3>{{ detail.title || t('wellness.diaries.untitled') }}</h3>
            <div class="journal-content">{{
              detail.storyBody || t('wellness.diaries.noStory')
            }}</div>
          </section>

          <section class="detail-section">
            <h3>{{ t('wellness.diaries.savedContext') }}</h3>
            <div v-if="detail.contextItems.length" class="context-list">
              <div v-for="item in detail.contextItems" :key="item.id" class="context-item">
                <ElTag effect="plain">{{ contextLabel(item.kind) }}</ElTag>
                <strong>{{ item.label }}</strong>
                <span v-if="item.note">{{ item.note }}</span>
              </div>
            </div>
            <ElEmpty v-else :description="t('wellness.diaries.noContext')" :image-size="72" />
          </section>

          <section class="detail-section">
            <h3>{{ t('wellness.diaries.events') }}</h3>
            <ElTable v-if="detail.events.length" :data="detail.events" size="small">
              <ElTableColumn :label="t('wellness.diaries.occurredAt')" width="170">
                <template #default="{ row }">{{ formatDateTime(row.occurredAt, locale) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('wellness.diaries.contextKind')" width="120">
                <template #default="{ row }">{{ contextLabel(row.category) }}</template>
              </ElTableColumn>
              <ElTableColumn prop="label" :label="t('wellness.diaries.content')" min-width="170" />
              <ElTableColumn :label="t('wellness.diaries.inputMethod')" width="100">
                <template #default="{ row }">{{ inputLabel(row.inputMethod) }}</template>
              </ElTableColumn>
            </ElTable>
            <ElEmpty v-else :description="t('wellness.diaries.noEvents')" :image-size="72" />
          </section>
        </template>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import {
    fetchDiaryDetail,
    fetchDiaryRecords,
    type DiaryDetail,
    type DiaryItem,
    type DiaryStats
  } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'
  import { formatDate, formatDateTime } from '../shared'

  defineOptions({ name: 'WellnessDiaries' })

  const { t, locale } = useI18n()
  const storyStatuses = ['pending', 'ready', 'failed']
  const contextKinds = [
    'training',
    'alcohol',
    'caffeine',
    'meal',
    'supplement',
    'medication',
    'mood',
    'stress',
    'symptom',
    'illness',
    'sleep_habit',
    'travel',
    'meditation',
    'cycle',
    'work',
    'social',
    'custom'
  ]

  const loading = ref(false)
  const detailLoading = ref(false)
  const drawerVisible = ref(false)
  const items = ref<DiaryItem[]>([])
  const detail = ref<DiaryDetail>()
  const stats = ref<DiaryStats>({
    recordCount: 0,
    userCount: 0,
    readyCount: 0,
    contextDiaryCount: 0,
    readyRate: 0,
    contextCoverage: 0
  })
  const pagination = reactive({ current: 1, size: 20, total: 0 })
  const filters = reactive({
    keyword: '',
    dates: [] as string[],
    storyStatus: '',
    contextKind: ''
  })

  const statCards = computed(() => [
    { label: t('wellness.common.records'), value: stats.value.recordCount },
    { label: t('wellness.common.users'), value: stats.value.userCount },
    { label: t('wellness.diaries.readyRate'), value: `${stats.value.readyRate.toFixed(1)}%` },
    {
      label: t('wellness.diaries.contextCoverage'),
      value: `${stats.value.contextCoverage.toFixed(1)}%`
    }
  ])

  const statusLabel = (status: string) => t(`wellness.diaries.status.${status}`)
  const contextLabel = (kind: string) => t(`wellness.diaries.context.${kind}`)
  const inputLabel = (method: string) => t(`wellness.diaries.input.${method}`)
  const statusType = (status: string) =>
    status === 'ready' ? 'success' : status === 'failed' ? 'danger' : 'warning'

  const load = async () => {
    loading.value = true
    try {
      const response = await fetchDiaryRecords({
        page: pagination.current,
        pageSize: pagination.size,
        keyword: filters.keyword || undefined,
        startDate: filters.dates?.[0],
        endDate: filters.dates?.[1],
        storyStatus: filters.storyStatus || undefined,
        contextKind: filters.contextKind || undefined
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
    Object.assign(filters, { keyword: '', dates: [], storyStatus: '', contextKind: '' })
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
    drawerVisible.value = true
    detailLoading.value = true
    detail.value = undefined
    try {
      detail.value = await fetchDiaryDetail(id)
    } finally {
      detailLoading.value = false
    }
  }

  load()
</script>

<style scoped lang="scss">
  @use '../shared';

  .story-cell {
    strong,
    small {
      display: block;
    }

    small {
      max-width: 420px;
      margin-top: 4px;
      overflow: hidden;
      color: var(--el-text-color-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .context-list {
    display: grid;
    gap: 10px;
  }

  .context-item {
    display: grid;
    grid-template-columns: 110px minmax(120px, 1fr) 2fr;
    gap: 12px;
    align-items: center;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;

    span:last-child {
      color: var(--el-text-color-secondary);
    }
  }
</style>
