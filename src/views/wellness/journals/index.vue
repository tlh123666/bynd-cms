<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading">
      <div
        ><p class="eyebrow">JOURNALS</p><h1>{{ t('wellness.journals.title') }}</h1
        ><p>{{ t('wellness.journals.subtitle') }}</p></div
      >
    </div>
    <StatCards :items="statCards" />
    <ElCard class="wellness-card art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="load">
        <template #left
          ><div class="wellness-search">
            <ElInput
              v-model="filters.keyword"
              class="keyword"
              clearable
              :placeholder="t('wellness.journals.searchPlaceholder')"
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
              v-model="filters.mood"
              class="select-filter"
              clearable
              :placeholder="t('wellness.journals.mood')"
            >
              <ElOption v-for="mood in 5" :key="mood" :label="moodLabel(mood)" :value="mood" />
            </ElSelect>
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
        <ElTableColumn :label="t('wellness.journals.titleColumn')" min-width="180"
          ><template #default="{ row }">{{
            row.title || t('wellness.journals.untitled')
          }}</template></ElTableColumn
        >
        <ElTableColumn :label="t('wellness.journals.mood')" width="120"
          ><template #default="{ row }"
            ><ElTag v-if="row.mood" effect="plain">{{ moodLabel(row.mood) }}</ElTag
            ><span v-else>—</span></template
          ></ElTableColumn
        >
        <ElTableColumn
          prop="contentPreview"
          :label="t('wellness.journals.preview')"
          min-width="300"
          show-overflow-tooltip
        />
        <ElTableColumn :label="t('wellness.common.updatedAt')" width="180"
          ><template #default="{ row }">{{
            formatDateTime(row.updatedAt, locale)
          }}</template></ElTableColumn
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
    <ElDrawer v-model="drawerVisible" :title="t('wellness.journals.detailTitle')" size="620px">
      <template v-if="detail">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="t('wellness.common.user')">{{
            detail.user.name
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.common.date')">{{
            formatDate(detail.statDate, locale)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.journals.mood')">{{
            detail.mood ? moodLabel(detail.mood) : '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('wellness.common.timezone')">{{
            detail.timezone
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="detail-section"
          ><h3>{{ detail.title || t('wellness.journals.untitled') }}</h3
          ><div class="journal-content">{{ detail.content }}</div></div
        >
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import {
    fetchJournalDetail,
    fetchJournalRecords,
    type JournalDetail,
    type JournalItem,
    type JournalStats
  } from '@/api/wellness'
  import StatCards from '../components/StatCards.vue'
  import { formatDate, formatDateTime } from '../shared'

  defineOptions({ name: 'WellnessJournals' })
  const { t, locale } = useI18n()
  const loading = ref(false),
    drawerVisible = ref(false)
  const items = ref<JournalItem[]>([]),
    detail = ref<JournalDetail>()
  const stats = ref<JournalStats>({ recordCount: 0, userCount: 0, averageMood: 0, moodCount: 0 })
  const pagination = reactive({ current: 1, size: 20, total: 0 })
  const filters = reactive<{ keyword: string; dates: string[]; mood?: number }>({
    keyword: '',
    dates: [],
    mood: undefined
  })
  const statCards = computed(() => [
    { label: t('wellness.common.records'), value: stats.value.recordCount },
    { label: t('wellness.common.users'), value: stats.value.userCount },
    {
      label: t('wellness.journals.averageMood'),
      value: stats.value.moodCount ? stats.value.averageMood.toFixed(1) : '—'
    },
    {
      label: t('wellness.journals.moodCoverage'),
      value: stats.value.recordCount
        ? `${Math.round((stats.value.moodCount / stats.value.recordCount) * 100)}%`
        : '0%'
    }
  ])
  const moodLabel = (mood: number) => t(`wellness.journals.moods.${mood}`)
  const load = async () => {
    loading.value = true
    try {
      const response = await fetchJournalRecords({
        page: pagination.current,
        pageSize: pagination.size,
        keyword: filters.keyword || undefined,
        startDate: filters.dates?.[0],
        endDate: filters.dates?.[1],
        mood: filters.mood
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
    filters.keyword = ''
    filters.dates = []
    filters.mood = undefined
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
    detail.value = await fetchJournalDetail(id)
    drawerVisible.value = true
  }
  load()
</script>

<style scoped lang="scss">
  @use '../shared';
</style>
