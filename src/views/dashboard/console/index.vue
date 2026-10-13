<template>
  <div class="dashboard-page">
    <header class="dashboard-heading">
      <div>
        <p class="eyebrow">BYND</p>
        <h1>{{ t('dashboardAdmin.title') }}</h1>
        <p>{{ t('dashboardAdmin.subtitle') }}</p>
      </div>
      <ElButton :loading="loading" @click="loadDashboard">{{
        t('dashboardAdmin.refresh')
      }}</ElButton>
    </header>

    <div class="stat-grid" v-loading="loading">
      <ElCard v-for="card in cards" :key="card.label" shadow="never" class="stat-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value.toLocaleString() }}</strong>
      </ElCard>
    </div>

    <ElCard shadow="never" class="recent-card">
      <template #header>
        <div class="card-header">
          <div
            ><h2>{{ t('dashboardAdmin.recentUsers') }}</h2
            ><p>{{ t('dashboardAdmin.recentUsersHint') }}</p></div
          >
          <ElButton link type="primary" @click="router.push({ name: 'User' })">{{
            t('dashboardAdmin.manageUsers')
          }}</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="recentUsers">
        <ElTableColumn :label="t('userAdmin.columns.user')" min-width="260">
          <template #default="{ row }"
            ><strong>{{ row.fullName || row.username || row.email }}</strong
            ><div class="muted">{{ row.email }}</div></template
          >
        </ElTableColumn>
        <ElTableColumn :label="t('userAdmin.fields.status')" min-width="140">
          <template #default="{ row }">{{ t(`userAdmin.status.${row.status}`) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('userAdmin.fields.createdAt')" min-width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </ElTableColumn>
        <template #empty><ElEmpty :description="t('userAdmin.empty')" /></template>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { fetchUsers, type CmsUser } from '@/api/system-manage'
  import { fetchCommunityChallenges, fetchCommunityGroups } from '@/api/community'

  defineOptions({ name: 'Console' })
  const { t, locale } = useI18n(),
    router = useRouter()
  const loading = ref(false),
    recentUsers = ref<CmsUser[]>([])
  const totals = reactive({ users: 0, groups: 0, challenges: 0, participants: 0 })
  const cards = computed(() => [
    { label: t('dashboardAdmin.cards.users'), value: totals.users },
    { label: t('dashboardAdmin.cards.groups'), value: totals.groups },
    { label: t('dashboardAdmin.cards.challenges'), value: totals.challenges },
    { label: t('dashboardAdmin.cards.participants'), value: totals.participants }
  ])
  async function loadDashboard() {
    loading.value = true
    try {
      const [userData, groupData, challengeData] = await Promise.all([
        fetchUsers({ page: 1, pageSize: 5 }),
        fetchCommunityGroups(),
        fetchCommunityChallenges()
      ])
      recentUsers.value = userData.items
      totals.users = userData.total
      totals.groups = groupData.items.length
      totals.challenges = challengeData.items.length
      totals.participants = challengeData.items.reduce((sum, item) => sum + item.enrollmentCount, 0)
    } finally {
      loading.value = false
    }
  }
  function formatDate(value: string) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(date)
  }
  onMounted(loadDashboard)
</script>

<style scoped lang="scss">
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .dashboard-heading,
  .card-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  }
  .dashboard-heading h1,
  .card-header h2 {
    margin: 0;
  }
  .dashboard-heading p,
  .card-header p {
    margin: 7px 0 0;
    color: var(--el-text-color-secondary);
  }
  .eyebrow {
    color: var(--el-color-primary) !important;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
  .stat-card {
    border-radius: 16px;
  }
  .stat-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .stat-card span,
  .muted {
    color: var(--el-text-color-secondary);
  }
  .stat-card strong {
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1;
  }
  .recent-card {
    border-radius: 16px;
  }
  .muted {
    margin-top: 4px;
    font-size: 13px;
  }
  @media (max-width: 900px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 560px) {
    .dashboard-heading,
    .card-header {
      align-items: stretch;
      flex-direction: column;
    }
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
