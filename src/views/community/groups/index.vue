<template>
  <div class="community-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">{{ t('groupAdmin.eyebrow') }}</p>
        <h1>{{ t('groupAdmin.title') }}</h1>
        <p>{{ t('groupAdmin.subtitle') }}</p>
      </div>
      <ElButton :loading="loading" @click="loadGroups">{{ t('groupAdmin.refresh') }}</ElButton>
    </div>

    <div class="stat-grid">
      <div class="stat-card"
        ><span>{{ t('groupAdmin.stats.groups') }}</span
        ><strong>{{ groups.length }}</strong></div
      >
      <div class="stat-card"
        ><span>{{ t('groupAdmin.stats.members') }}</span
        ><strong>{{ totals.members }}</strong></div
      >
      <div class="stat-card"
        ><span>{{ t('groupAdmin.stats.goals') }}</span
        ><strong>{{ totals.goals }}</strong></div
      >
      <div class="stat-card"
        ><span>{{ t('groupAdmin.stats.messages') }}</span
        ><strong>{{ totals.messages }}</strong></div
      >
    </div>

    <ElCard shadow="never" class="content-card">
      <div class="filters">
        <ElInput
          v-model="filters.keyword"
          clearable
          :placeholder="t('groupAdmin.filters.keyword')"
          @keyup.enter="loadGroups"
        />
        <ElSelect
          v-model="filters.visibility"
          clearable
          :placeholder="t('groupAdmin.filters.visibility')"
        >
          <ElOption :label="t('groupAdmin.visibility.public')" value="public" />
          <ElOption :label="t('groupAdmin.visibility.private')" value="private" />
        </ElSelect>
        <ElSelect v-model="filters.status" clearable :placeholder="t('groupAdmin.filters.status')">
          <ElOption :label="t('groupAdmin.status.active')" value="active" />
          <ElOption :label="t('groupAdmin.status.archived')" value="archived" />
        </ElSelect>
        <ElButton type="primary" @click="loadGroups">{{ t('groupAdmin.filters.search') }}</ElButton>
        <ElButton @click="resetFilters">{{ t('groupAdmin.filters.reset') }}</ElButton>
      </div>

      <ElTable v-loading="loading" :data="groups" row-key="id">
        <ElTableColumn :label="t('groupAdmin.columns.group')" min-width="260">
          <template #default="{ row }">
            <div class="group-cell">
              <ElAvatar :size="42" :src="row.avatarUrl">{{ row.name.slice(0, 1) }}</ElAvatar>
              <div
                ><strong>{{ row.name }}</strong
                ><small>ID {{ row.publicId }}</small></div
              >
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="ownerName" :label="t('groupAdmin.columns.owner')" min-width="130" />
        <ElTableColumn :label="t('groupAdmin.columns.type')" min-width="130">
          <template #default="{ row }"
            ><ElTag effect="plain">{{ visibilityLabel(row.visibility) }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn
          prop="memberCount"
          :label="t('groupAdmin.columns.members')"
          min-width="110"
        />
        <ElTableColumn prop="goalCount" :label="t('groupAdmin.columns.goals')" min-width="100" />
        <ElTableColumn
          prop="messageCount"
          :label="t('groupAdmin.columns.messages')"
          min-width="115"
        />
        <ElTableColumn :label="t('groupAdmin.columns.status')" min-width="120">
          <template #default="{ row }"
            ><ElTag :type="row.status === 'active' ? 'success' : 'info'">{{
              statusLabel(row.status)
            }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn :label="t('groupAdmin.columns.created')" min-width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('groupAdmin.columns.actions')" min-width="120" fixed="right">
          <template #default="{ row }"
            ><ElButton link type="primary" @click="selected = row">{{
              t('groupAdmin.details')
            }}</ElButton></template
          >
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!loading && groups.length === 0" :description="t('groupAdmin.empty')" />
    </ElCard>

    <ElDrawer v-model="drawerVisible" :title="t('groupAdmin.detailTitle')" size="440px">
      <template v-if="selected">
        <div class="detail-head">
          <ElAvatar :size="64" :src="selected.avatarUrl">{{ selected.name.slice(0, 1) }}</ElAvatar>
          <div
            ><h2>{{ selected.name }}</h2
            ><p>{{ t('groupAdmin.groupId', { id: selected.publicId }) }}</p></div
          >
        </div>
        <p class="description">{{ selected.description || t('groupAdmin.noDescription') }}</p>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem :label="t('groupAdmin.columns.owner')">{{
            selected.ownerName || t('groupAdmin.unknown')
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('groupAdmin.filters.visibility')">{{
            visibilityLabel(selected.visibility, true)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('groupAdmin.activeMembers')">{{
            selected.memberCount
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('groupAdmin.totalGoals')">{{
            selected.goalCount
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('groupAdmin.validMessages')">{{
            selected.messageCount
          }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('groupAdmin.columns.created')">{{
            formatDate(selected.createdAt)
          }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { fetchCommunityGroups, type CommunityGroup } from '@/api/community'

  defineOptions({ name: 'CommunityGroups' })
  const { t, locale } = useI18n()
  const loading = ref(false)
  const groups = ref<CommunityGroup[]>([])
  const selected = ref<CommunityGroup>()
  const drawerVisible = computed({
    get: () => !!selected.value,
    set: (value) => {
      if (!value) selected.value = undefined
    }
  })
  const filters = ref({ keyword: '', visibility: '', status: '' })
  const totals = computed(() =>
    groups.value.reduce(
      (sum, item) => ({
        members: sum.members + item.memberCount,
        goals: sum.goals + item.goalCount,
        messages: sum.messages + item.messageCount
      }),
      { members: 0, goals: 0, messages: 0 }
    )
  )

  const loadGroups = async () => {
    loading.value = true
    try {
      const params = Object.fromEntries(Object.entries(filters.value).filter(([, value]) => value))
      groups.value = (await fetchCommunityGroups(params)).items
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t('groupAdmin.loadFailed'))
    } finally {
      loading.value = false
    }
  }
  const resetFilters = () => {
    filters.value = { keyword: '', visibility: '', status: '' }
    loadGroups()
  }
  const visibilityLabel = (value: string, detailed = false) => {
    const key =
      value === 'public'
        ? detailed
          ? 'publicGroup'
          : 'public'
        : detailed
          ? 'privateGroup'
          : 'private'
    return t(`groupAdmin.visibility.${key}`)
  }
  const statusLabel = (value: string) =>
    ['active', 'archived'].includes(value) ? t(`groupAdmin.status.${value}`) : value
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(
      locale.value === 'zh' ? 'zh-CN' : locale.value === 'pt' ? 'pt-BR' : 'en-US',
      { dateStyle: 'medium', timeStyle: 'short' }
    ).format(new Date(value))

  loadGroups()
</script>

<style scoped lang="scss">
  .community-page {
    padding: 4px;
  }
  .page-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
    h1 {
      margin: 2px 0 6px;
      font-size: 28px;
    }
    p {
      margin: 0;
      color: var(--el-text-color-secondary);
    }
  }
  .eyebrow {
    font-size: 12px;
    color: var(--el-color-primary) !important;
    letter-spacing: 0.16em;
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 16px;
  }
  .stat-card {
    padding: 18px 20px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 14px;
    span {
      display: block;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
    strong {
      display: block;
      margin-top: 8px;
      font-size: 26px;
    }
  }
  .content-card {
    border-radius: 14px;
  }
  :deep(.el-table th .cell) {
    line-height: 1.25;
    white-space: normal;
    word-break: normal;
  }
  .filters {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) 150px 140px auto auto;
    gap: 10px;
    margin-bottom: 18px;
  }
  .group-cell {
    display: flex;
    gap: 12px;
    align-items: center;
    strong,
    small {
      display: block;
    }
    small {
      margin-top: 4px;
      color: var(--el-text-color-secondary);
    }
  }
  .detail-head {
    display: flex;
    gap: 16px;
    align-items: center;
    h2,
    p {
      margin: 0;
    }
    p {
      margin-top: 5px;
      color: var(--el-text-color-secondary);
    }
  }
  .description {
    margin: 22px 0;
    line-height: 1.7;
    color: var(--el-text-color-regular);
  }
  @media (width <= 900px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .filters {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
