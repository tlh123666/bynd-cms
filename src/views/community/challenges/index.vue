<template>
  <div class="challenge-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">PREMIUM COMMUNITY</p>
        <h1>挑战管理</h1>
        <p>策划 BYND 与专业人士创建的 Premium 挑战体验。</p>
      </div>
      <ElButton type="primary" @click="openEditor()">创建挑战</ElButton>
    </div>

    <div class="stat-grid">
      <div class="stat-card"
        ><span>全部挑战</span><strong>{{ challenges.length }}</strong></div
      >
      <div class="stat-card"
        ><span>已发布</span><strong>{{ statusCount.published }}</strong></div
      >
      <div class="stat-card"
        ><span>草稿</span><strong>{{ statusCount.draft }}</strong></div
      >
      <div class="stat-card"
        ><span>参与人数</span><strong>{{ enrollmentTotal }}</strong></div
      >
    </div>

    <ElCard shadow="never" class="content-card">
      <div class="filters">
        <ElInput
          v-model="filters.keyword"
          clearable
          placeholder="搜索标题或 slug"
          @keyup.enter="loadChallenges"
        />
        <ElSelect v-model="filters.domain" clearable placeholder="挑战领域">
          <ElOption
            v-for="item in domains"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect v-model="filters.status" clearable placeholder="状态">
          <ElOption label="草稿" value="draft" /><ElOption
            label="已发布"
            value="published"
          /><ElOption label="已归档" value="archived" />
        </ElSelect>
        <ElButton type="primary" @click="loadChallenges">查询</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
      </div>

      <ElTable v-loading="loading" :data="challenges" row-key="id">
        <ElTableColumn label="挑战" min-width="300">
          <template #default="{ row }">
            <div class="challenge-cell">
              <ElImage v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="cover" />
              <div v-else class="cover placeholder">BYND</div>
              <div
                ><strong>{{ row.title }}</strong
                ><small>{{ domainLabel(row.domain) }} · {{ row.durationDays }} 天</small></div
              >
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="内容进度" width="170">
          <template #default="{ row }"
            ><ElProgress :percentage="contentProgress(row)" :stroke-width="7"
          /></template>
        </ElTableColumn>
        <ElTableColumn prop="enrollmentCount" label="参与人数" width="100" />
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }"
            ><ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditor(row)">编辑</ElButton>
            <ElButton link type="primary" @click="openDays(row)">每日内容</ElButton>
            <ElButton v-if="row.status === 'draft'" link type="success" @click="publish(row)"
              >发布</ElButton
            >
            <ElButton v-if="row.status !== 'archived'" link type="danger" @click="archive(row)"
              >归档</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!loading && challenges.length === 0" description="暂无挑战" />
    </ElCard>

    <ElDrawer
      v-model="editorVisible"
      :title="editingId ? '编辑挑战' : '创建挑战'"
      size="620px"
      destroy-on-close
    >
      <ElForm label-position="top" :model="form">
        <div class="form-grid">
          <ElFormItem label="挑战名称" class="wide"
            ><ElInput v-model="form.title" maxlength="180" show-word-limit
          /></ElFormItem>
          <ElFormItem label="Slug"
            ><ElInput v-model="form.slug" placeholder="7-day-mobility"
          /></ElFormItem>
          <ElFormItem label="领域"
            ><ElSelect v-model="form.domain"
              ><ElOption
                v-for="item in domains"
                :key="item.value"
                :label="item.label"
                :value="item.value" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="持续天数"
            ><ElInputNumber v-model="form.durationDays" :min="1" :max="365"
          /></ElFormItem>
          <ElFormItem label="排序"><ElInputNumber v-model="form.sortOrder" :min="0" /></ElFormItem>
          <ElFormItem label="摘要" class="wide"
            ><ElInput
              v-model="form.summary"
              type="textarea"
              :rows="2"
              maxlength="500"
              show-word-limit
          /></ElFormItem>
          <ElFormItem label="完整介绍" class="wide"
            ><ElInput
              v-model="form.description"
              type="textarea"
              :rows="5"
              maxlength="10000"
              show-word-limit
          /></ElFormItem>
          <ElFormItem label="封面 URL" class="wide"><ElInput v-model="form.coverUrl" /></ElFormItem>
          <ElFormItem label="上线时间"
            ><ElDatePicker
              v-model="form.availableFrom"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ssZ"
          /></ElFormItem>
          <ElFormItem label="下线时间"
            ><ElDatePicker
              v-model="form.availableUntil"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ssZ"
          /></ElFormItem>
        </div>
        <ElDivider content-position="left">专家信息（可选）</ElDivider>
        <div class="form-grid">
          <ElFormItem label="姓名"><ElInput v-model="form.expertName" /></ElFormItem>
          <ElFormItem label="职称"><ElInput v-model="form.expertTitle" /></ElFormItem>
          <ElFormItem label="资历 / 注册号"><ElInput v-model="form.expertCredential" /></ElFormItem>
          <ElFormItem label="头像 URL"><ElInput v-model="form.expertAvatarUrl" /></ElFormItem>
        </div>
      </ElForm>
      <template #footer
        ><ElButton @click="editorVisible = false">取消</ElButton
        ><ElButton type="primary" :loading="saving" @click="saveChallenge">保存</ElButton></template
      >
    </ElDrawer>

    <ElDrawer v-model="daysVisible" title="每日内容" size="680px" destroy-on-close>
      <template v-if="activeChallenge">
        <div class="days-head"
          ><div
            ><h2>{{ activeChallenge.title }}</h2
            ><p
              >已完成 {{ activeChallenge.dayCount }} / {{ activeChallenge.durationDays }} 天</p
            ></div
          ><ElTag>{{ domainLabel(activeChallenge.domain) }}</ElTag></div
        >
        <div class="day-selector">
          <ElButton
            v-for="day in activeChallenge.durationDays"
            :key="day"
            :type="dayNumber === day ? 'primary' : undefined"
            :plain="dayNumber !== day"
            @click="selectDay(day)"
            >第 {{ day }} 天</ElButton
          >
        </div>
        <ElForm label-position="top" :model="dayForm">
          <ElFormItem label="标题"><ElInput v-model="dayForm.title" maxlength="180" /></ElFormItem>
          <ElFormItem label="内容"
            ><ElInput v-model="dayForm.content" type="textarea" :rows="7" maxlength="20000"
          /></ElFormItem>
          <ElFormItem label="当天行动"
            ><ElInput v-model="dayForm.action" type="textarea" :rows="2" maxlength="500"
          /></ElFormItem>
          <div class="form-grid">
            <ElFormItem label="记录方式"
              ><ElSelect v-model="dayForm.trackingMode"
                ><ElOption label="手动完成" value="manual" /><ElOption
                  label="训练自动验证"
                  value="workout" /></ElSelect
            ></ElFormItem>
            <template v-if="dayForm.trackingMode === 'workout'">
              <ElFormItem label="训练指标"
                ><ElSelect v-model="dayForm.workoutMetric"
                  ><ElOption label="训练次数" value="workout_count" /><ElOption
                    label="活跃分钟"
                    value="active_minutes" /><ElOption
                    label="距离（km）"
                    value="distance_km" /><ElOption label="热量" value="calories" /><ElOption
                    label="步数"
                    value="steps" /></ElSelect
              ></ElFormItem>
              <ElFormItem label="活动代码"
                ><ElInput v-model="dayForm.activityCode" placeholder="留空代表全部训练"
              /></ElFormItem>
              <ElFormItem label="目标值"
                ><ElInputNumber v-model="dayForm.targetValue" :min="0.01"
              /></ElFormItem>
            </template>
          </div>
        </ElForm>
      </template>
      <template #footer
        ><ElButton type="primary" :loading="savingDay" @click="saveDay"
          >保存第 {{ dayNumber }} 天</ElButton
        ></template
      >
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    archiveCommunityChallenge,
    createCommunityChallenge,
    fetchCommunityChallenge,
    fetchCommunityChallenges,
    publishCommunityChallenge,
    saveCommunityChallengeDay,
    updateCommunityChallenge,
    type ChallengeDay,
    type ChallengePayload,
    type CommunityChallenge,
    type CommunityDomain
  } from '@/api/community'

  defineOptions({ name: 'CommunityChallenges' })
  const domains: { value: CommunityDomain; label: string }[] = [
    { value: 'body', label: '身体' },
    { value: 'mind', label: '头脑' },
    { value: 'sleep_recovery', label: '睡眠与恢复' },
    { value: 'nutrition_metabolism', label: '营养与代谢' },
    { value: 'longevity', label: '长寿' },
    { value: 'sustainable_performance', label: '可持续表现' },
    { value: 'life_wellbeing', label: '生活与福祉' }
  ]
  const blankForm = (): ChallengePayload => ({
    slug: '',
    title: '',
    summary: '',
    description: '',
    domain: 'body',
    coverUrl: '',
    durationDays: 7,
    expertName: '',
    expertTitle: '',
    expertCredential: '',
    expertAvatarUrl: '',
    availableFrom: '',
    availableUntil: '',
    sortOrder: 0
  })
  const blankDay = (): Omit<ChallengeDay, 'id' | 'dayNumber'> => ({
    title: '',
    content: '',
    action: '',
    trackingMode: 'manual',
    activityCode: '',
    workoutMetric: undefined,
    targetValue: undefined
  })
  const loading = ref(false),
    saving = ref(false),
    savingDay = ref(false)
  const challenges = ref<CommunityChallenge[]>([])
  const filters = reactive({ keyword: '', domain: '', status: '' })
  const editorVisible = ref(false),
    daysVisible = ref(false),
    editingId = ref('')
  const form = reactive<ChallengePayload>(blankForm())
  const activeChallenge = ref<CommunityChallenge>(),
    dayNumber = ref(1)
  const dayForm = reactive(blankDay())
  const statusCount = computed(() => ({
    published: challenges.value.filter((v) => v.status === 'published').length,
    draft: challenges.value.filter((v) => v.status === 'draft').length
  }))
  const enrollmentTotal = computed(() =>
    challenges.value.reduce((sum, item) => sum + item.enrollmentCount, 0)
  )

  const loadChallenges = async () => {
    loading.value = true
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
      challenges.value = (await fetchCommunityChallenges(params)).items
    } finally {
      loading.value = false
    }
  }
  const resetFilters = () => {
    filters.keyword = ''
    filters.domain = ''
    filters.status = ''
    loadChallenges()
  }
  const openEditor = (item?: CommunityChallenge) => {
    editingId.value = item?.id || ''
    Object.assign(form, blankForm(), item || {}, {
      expertName: item?.expert?.name || '',
      expertTitle: item?.expert?.title || '',
      expertCredential: item?.expert?.credential || '',
      expertAvatarUrl: item?.expert?.avatarUrl || ''
    })
    editorVisible.value = true
  }
  const saveChallenge = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.description.trim())
      return ElMessage.warning('请填写名称、Slug 和完整介绍')
    saving.value = true
    try {
      if (editingId.value) {
        await updateCommunityChallenge(editingId.value, { ...form })
      } else {
        await createCommunityChallenge({ ...form })
      }
      ElMessage.success('挑战已保存')
      editorVisible.value = false
      await loadChallenges()
    } finally {
      saving.value = false
    }
  }
  const openDays = async (item: CommunityChallenge) => {
    activeChallenge.value = await fetchCommunityChallenge(item.id)
    dayNumber.value = 1
    selectDay(1)
    daysVisible.value = true
  }
  const selectDay = (number: number) => {
    dayNumber.value = number
    const existing = activeChallenge.value?.days.find((v) => v.dayNumber === number)
    Object.assign(dayForm, blankDay(), existing || {})
  }
  const saveDay = async () => {
    if (
      !activeChallenge.value ||
      !dayForm.title.trim() ||
      !dayForm.content.trim() ||
      !dayForm.action.trim()
    )
      return ElMessage.warning('请完整填写当天标题、内容和行动')
    savingDay.value = true
    try {
      activeChallenge.value = await saveCommunityChallengeDay(
        activeChallenge.value.id,
        dayNumber.value,
        { ...dayForm }
      )
      ElMessage.success(`第 ${dayNumber.value} 天已保存`)
      await loadChallenges()
    } finally {
      savingDay.value = false
    }
  }
  const publish = async (item: CommunityChallenge) => {
    await ElMessageBox.confirm('发布后 Premium 用户即可看到该挑战，确定继续？', '发布挑战')
    await publishCommunityChallenge(item.id)
    ElMessage.success('挑战已发布')
    loadChallenges()
  }
  const archive = async (item: CommunityChallenge) => {
    await ElMessageBox.confirm('归档后挑战将从用户目录中移除，但参与历史会保留。', '归档挑战', {
      type: 'warning'
    })
    await archiveCommunityChallenge(item.id)
    ElMessage.success('挑战已归档')
    loadChallenges()
  }
  const domainLabel = (value: CommunityDomain) =>
    domains.find((v) => v.value === value)?.label || value
  const contentProgress = (item: CommunityChallenge) =>
    Math.round(Math.min(100, (item.dayCount / item.durationDays) * 100))
  const statusLabel = (value: string) =>
    ({ draft: '草稿', published: '已发布', archived: '已归档' })[value] || value
  const statusType = (value: string) =>
    value === 'published' ? 'success' : value === 'archived' ? 'info' : 'warning'
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value)
    )
  loadChallenges()
</script>

<style scoped lang="scss">
  .challenge-page {
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
    grid-template-columns: minmax(240px, 1fr) 190px 140px auto auto;
    gap: 10px;
    margin-bottom: 18px;
  }

  .challenge-cell {
    display: flex;
    gap: 12px;
    align-items: center;

    strong,
    small {
      display: block;
    }

    small {
      margin-top: 5px;
      color: var(--el-text-color-secondary);
    }
  }

  .cover {
    width: 54px;
    height: 54px;
    background: var(--el-fill-color);
    border-radius: 12px;
  }

  .placeholder {
    display: grid;
    place-items: center;
    font-size: 10px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.12em;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;

    .wide {
      grid-column: 1 / -1;
    }
  }

  .days-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;

    h2,
    p {
      margin: 0;
    }

    p {
      margin-top: 6px;
      color: var(--el-text-color-secondary);
    }
  }

  .day-selector {
    display: flex;
    gap: 8px;
    padding-bottom: 14px;
    margin-bottom: 14px;
    overflow-x: auto;

    .el-button {
      flex: 0 0 auto;
      margin-left: 0;
    }
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
