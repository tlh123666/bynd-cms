<template>
  <div class="community-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">COMMUNITY</p>
        <h1>小组监管</h1>
        <p>查看用户创建的小组、参与规模与社区活跃情况。</p>
      </div>
      <ElButton :loading="loading" @click="loadGroups">刷新数据</ElButton>
    </div>

    <div class="stat-grid">
      <div class="stat-card"
        ><span>小组总数</span><strong>{{ groups.length }}</strong></div
      >
      <div class="stat-card"
        ><span>活跃成员</span><strong>{{ totals.members }}</strong></div
      >
      <div class="stat-card"
        ><span>小组目标</span><strong>{{ totals.goals }}</strong></div
      >
      <div class="stat-card"
        ><span>聊天消息</span><strong>{{ totals.messages }}</strong></div
      >
    </div>

    <ElCard shadow="never" class="content-card">
      <div class="filters">
        <ElInput
          v-model="filters.keyword"
          clearable
          placeholder="搜索群名称或数字 ID"
          @keyup.enter="loadGroups"
        />
        <ElSelect v-model="filters.visibility" clearable placeholder="公开范围">
          <ElOption label="公开" value="public" />
          <ElOption label="私密" value="private" />
        </ElSelect>
        <ElSelect v-model="filters.status" clearable placeholder="状态">
          <ElOption label="活跃" value="active" />
          <ElOption label="已归档" value="archived" />
        </ElSelect>
        <ElButton type="primary" @click="loadGroups">查询</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
      </div>

      <ElTable v-loading="loading" :data="groups" row-key="id">
        <ElTableColumn label="小组" min-width="260">
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
        <ElTableColumn prop="ownerName" label="群主" min-width="130" />
        <ElTableColumn label="类型" width="100">
          <template #default="{ row }"
            ><ElTag effect="plain">{{
              row.visibility === 'public' ? '公开' : '私密'
            }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn prop="memberCount" label="成员" width="90" />
        <ElTableColumn prop="goalCount" label="目标" width="90" />
        <ElTableColumn prop="messageCount" label="消息" width="90" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }"
            ><ElTag :type="row.status === 'active' ? 'success' : 'info'">{{
              row.status === 'active' ? '活跃' : '已归档'
            }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="90" fixed="right">
          <template #default="{ row }"
            ><ElButton link type="primary" @click="selected = row">详情</ElButton></template
          >
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!loading && groups.length === 0" description="没有找到小组" />
    </ElCard>

    <ElDrawer v-model="drawerVisible" title="小组详情" size="440px">
      <template v-if="selected">
        <div class="detail-head">
          <ElAvatar :size="64" :src="selected.avatarUrl">{{ selected.name.slice(0, 1) }}</ElAvatar>
          <div
            ><h2>{{ selected.name }}</h2
            ><p>群 ID {{ selected.publicId }}</p></div
          >
        </div>
        <p class="description">{{ selected.description || '暂无小组介绍' }}</p>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="群主">{{ selected.ownerName || '未知' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="公开范围">{{
            selected.visibility === 'public' ? '公开小组' : '私密小组'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="活跃成员">{{ selected.memberCount }}</ElDescriptionsItem>
          <ElDescriptionsItem label="累计目标">{{ selected.goalCount }}</ElDescriptionsItem>
          <ElDescriptionsItem label="有效消息">{{ selected.messageCount }}</ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">{{
            formatDate(selected.createdAt)
          }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { fetchCommunityGroups, type CommunityGroup } from '@/api/community'

  defineOptions({ name: 'CommunityGroups' })
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
      ElMessage.error(error instanceof Error ? error.message : '小组数据加载失败')
    } finally {
      loading.value = false
    }
  }
  const resetFilters = () => {
    filters.value = { keyword: '', visibility: '', status: '' }
    loadGroups()
  }
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value)
    )
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
