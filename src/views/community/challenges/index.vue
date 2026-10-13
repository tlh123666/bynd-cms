<template>
  <div class="challenge-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">BYND COMMUNITY</p>
        <h1>Challenge Management</h1>
        <p>Create and manage BYND challenges and their daily content.</p>
      </div>
      <ElButton type="primary" @click="openEditor()">Create Challenge</ElButton>
    </div>

    <div class="stat-grid">
      <div class="stat-card"
        ><span>All Challenges</span><strong>{{ challenges.length }}</strong></div
      >
      <div class="stat-card"
        ><span>Published</span><strong>{{ statusCount.published }}</strong></div
      >
      <div class="stat-card"
        ><span>Drafts</span><strong>{{ statusCount.draft }}</strong></div
      >
      <div class="stat-card"
        ><span>Participants</span><strong>{{ enrollmentTotal }}</strong></div
      >
    </div>

    <ElCard shadow="never" class="content-card">
      <div class="filters">
        <ElInput
          v-model="filters.keyword"
          clearable
          placeholder="Search title or slug"
          @keyup.enter="loadChallenges"
        />
        <ElSelect v-model="filters.domain" clearable placeholder="Domain">
          <ElOption
            v-for="item in domains"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect v-model="filters.status" clearable placeholder="Status">
          <ElOption label="Draft" value="draft" /><ElOption
            label="Published"
            value="published"
          /><ElOption label="Archived" value="archived" />
        </ElSelect>
        <ElButton type="primary" @click="loadChallenges">Search</ElButton>
        <ElButton @click="resetFilters">Reset</ElButton>
      </div>

      <ElTable v-loading="loading" :data="challenges" row-key="id">
        <ElTableColumn label="Challenge" min-width="300">
          <template #default="{ row }">
            <div class="challenge-cell">
              <ElImage v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="cover" />
              <div v-else class="cover placeholder">BYND</div>
              <div
                ><strong>{{ row.title }}</strong
                ><small>{{ domainLabel(row.domain) }} · {{ row.durationDays }} days</small></div
              >
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Content Progress" width="170">
          <template #default="{ row }"
            ><ElProgress :percentage="contentProgress(row)" :stroke-width="7"
          /></template>
        </ElTableColumn>
        <ElTableColumn prop="enrollmentCount" label="Participants" width="110" />
        <ElTableColumn label="Status" width="110">
          <template #default="{ row }"
            ><ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn label="Updated" width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn label="Actions" width="280" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditor(row)">Edit</ElButton>
            <ElButton link type="primary" @click="openDays(row)">Daily Content</ElButton>
            <ElButton v-if="row.status === 'draft'" link type="success" @click="publish(row)"
              >Publish</ElButton
            >
            <ElButton v-if="row.status !== 'archived'" link type="danger" @click="archive(row)"
              >Archive</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!loading && challenges.length === 0" description="No challenges" />
    </ElCard>

    <ElDrawer
      v-model="editorVisible"
      :title="editingId ? 'Edit Challenge' : 'Create Challenge'"
      size="620px"
      destroy-on-close
    >
      <ElForm label-position="top" :model="form">
        <div class="form-grid">
          <ElFormItem label="Challenge Name" class="wide"
            ><ElInput v-model="form.title" maxlength="180" show-word-limit
          /></ElFormItem>
          <ElFormItem label="Slug"
            ><ElInput v-model="form.slug" placeholder="7-day-mobility"
          /></ElFormItem>
          <ElFormItem label="Domain"
            ><ElSelect v-model="form.domain"
              ><ElOption
                v-for="item in domains"
                :key="item.value"
                :label="item.label"
                :value="item.value" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="Duration (days)"
            ><ElInputNumber v-model="form.durationDays" :min="1" :max="365"
          /></ElFormItem>
          <ElFormItem label="Sort Order"><ElInputNumber v-model="form.sortOrder" :min="0" /></ElFormItem>
          <ElFormItem label="Summary" class="wide"
            ><ElInput
              v-model="form.summary"
              type="textarea"
              :rows="2"
              maxlength="500"
              show-word-limit
          /></ElFormItem>
          <ElFormItem label="Description" class="wide"
            ><ElInput
              v-model="form.description"
              type="textarea"
              :rows="5"
              maxlength="10000"
              show-word-limit
          /></ElFormItem>
          <ElFormItem label="Cover URL" class="wide"><ElInput v-model="form.coverUrl" /></ElFormItem>
          <ElFormItem label="Available From"
            ><ElDatePicker
              v-model="form.availableFrom"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ssZ"
          /></ElFormItem>
          <ElFormItem label="Available Until"
            ><ElDatePicker
              v-model="form.availableUntil"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ssZ"
          /></ElFormItem>
        </div>
        <ElDivider />
        <div class="expert-heading">
          <div>
            <strong>Expert Collaboration</strong>
            <small>When enabled, name, title and credential are required.</small>
          </div>
          <ElSwitch v-model="expertEnabled" />
        </div>
        <div v-if="expertEnabled" class="form-grid">
          <ElFormItem label="Name" required><ElInput v-model="form.expertName" /></ElFormItem>
          <ElFormItem label="Title" required><ElInput v-model="form.expertTitle" /></ElFormItem>
          <ElFormItem label="Credential / Registration" required
            ><ElInput v-model="form.expertCredential"
          /></ElFormItem>
          <ElFormItem label="Avatar URL"><ElInput v-model="form.expertAvatarUrl" /></ElFormItem>
        </div>
      </ElForm>
      <template #footer
        ><ElButton @click="editorVisible = false">Cancel</ElButton
        ><ElButton type="primary" :loading="saving" @click="saveChallenge">Save</ElButton></template
      >
    </ElDrawer>

    <ElDrawer v-model="daysVisible" title="Daily Content" size="680px" destroy-on-close>
      <template v-if="activeChallenge">
        <div class="days-head"
          ><div
            ><h2>{{ activeChallenge.title }}</h2
            ><p
              >Configured {{ activeChallenge.dayCount }} / {{ activeChallenge.durationDays }} days</p
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
            >Day {{ day }}</ElButton
          >
        </div>
        <ElForm label-position="top" :model="dayForm">
          <ElFormItem label="Title"><ElInput v-model="dayForm.title" maxlength="180" /></ElFormItem>
          <ElFormItem label="Content"
            ><ElInput v-model="dayForm.content" type="textarea" :rows="7" maxlength="20000"
          /></ElFormItem>
          <ElFormItem label="Daily Action"
            ><ElInput v-model="dayForm.action" type="textarea" :rows="2" maxlength="500"
          /></ElFormItem>
          <div class="form-grid">
            <ElFormItem label="Tracking Method"
              ><ElSelect v-model="dayForm.trackingMode" @change="handleTrackingModeChange"
                ><ElOption label="Manual completion" value="manual" /><ElOption
                  label="Verified workout"
                  value="workout" /></ElSelect
            ></ElFormItem>
            <template v-if="dayForm.trackingMode === 'workout'">
              <ElFormItem label="Workout Metric" required
                ><ElSelect v-model="dayForm.workoutMetric"
                  ><ElOption label="Workout count" value="workout_count" /><ElOption
                    label="Active minutes"
                    value="active_minutes" /><ElOption
                    label="Distance (km)"
                    value="distance_km" /><ElOption label="Calories" value="calories" /><ElOption
                    label="Steps"
                    value="steps" /></ElSelect
              ></ElFormItem>
              <ElFormItem label="Activity Code"
                ><ElInput v-model="dayForm.activityCode" placeholder="Leave blank for all workouts"
              /></ElFormItem>
              <ElFormItem label="Target Value" required
                ><ElInputNumber v-model="dayForm.targetValue" :min="0.01"
              /></ElFormItem>
            </template>
          </div>
        </ElForm>
      </template>
      <template #footer
        ><ElButton type="primary" :loading="savingDay" @click="saveDay"
          >Save Day {{ dayNumber }}</ElButton
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
    { value: 'body', label: 'Body' },
    { value: 'mind', label: 'Mind' },
    { value: 'sleep_recovery', label: 'Sleep & Recovery' },
    { value: 'nutrition_metabolism', label: 'Nutrition & Metabolism' },
    { value: 'longevity', label: 'Longevity' },
    { value: 'sustainable_performance', label: 'Sustainable Performance' },
    { value: 'life_wellbeing', label: 'Life & Wellbeing' }
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
  const expertEnabled = ref(false)
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
    expertEnabled.value = Boolean(item?.expert)
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
      return ElMessage.warning('Enter a name, slug and description.')
    if (
      expertEnabled.value &&
      (!form.expertName.trim() || !form.expertTitle.trim() || !form.expertCredential.trim())
    )
      return ElMessage.warning('Complete the expert name, title and credential.')

    const payload: ChallengePayload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      expertName: expertEnabled.value ? form.expertName.trim() : '',
      expertTitle: expertEnabled.value ? form.expertTitle.trim() : '',
      expertCredential: expertEnabled.value ? form.expertCredential.trim() : '',
      expertAvatarUrl: expertEnabled.value ? form.expertAvatarUrl.trim() : ''
    }
    saving.value = true
    try {
      if (editingId.value) {
        await updateCommunityChallenge(editingId.value, payload)
      } else {
        await createCommunityChallenge(payload)
      }
      ElMessage.success('Challenge saved.')
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
    handleTrackingModeChange()
  }
  const handleTrackingModeChange = () => {
    if (dayForm.trackingMode === 'workout') {
      dayForm.workoutMetric ||= 'workout_count'
      if (!dayForm.targetValue || dayForm.targetValue <= 0) dayForm.targetValue = 1
      return
    }
    dayForm.activityCode = ''
    dayForm.workoutMetric = undefined
    dayForm.targetValue = undefined
  }
  const saveDay = async () => {
    if (
      !activeChallenge.value ||
      !dayForm.title.trim() ||
      !dayForm.content.trim() ||
      !dayForm.action.trim()
    )
      return ElMessage.warning('Complete the title, content and action for this day.')

    if (
      dayForm.trackingMode === 'workout' &&
      (!dayForm.workoutMetric || !dayForm.targetValue || dayForm.targetValue <= 0)
    ) {
      return ElMessage.warning('Select a workout metric and enter a target greater than zero.')
    }

    const payload: Omit<ChallengeDay, 'id' | 'dayNumber'> = {
      title: dayForm.title.trim(),
      content: dayForm.content.trim(),
      action: dayForm.action.trim(),
      trackingMode: dayForm.trackingMode
    }
    if (dayForm.trackingMode === 'workout') {
      payload.activityCode = dayForm.activityCode?.trim() || undefined
      payload.workoutMetric = dayForm.workoutMetric
      payload.targetValue = dayForm.targetValue
    }

    savingDay.value = true
    try {
      activeChallenge.value = await saveCommunityChallengeDay(
        activeChallenge.value.id,
        dayNumber.value,
        payload
      )
      ElMessage.success(`Day ${dayNumber.value} saved.`)
      await loadChallenges()
    } finally {
      savingDay.value = false
    }
  }
  const publish = async (item: CommunityChallenge) => {
    const detail = await fetchCommunityChallenge(item.id)
    const configuredDays = new Set(detail.days.map((day) => day.dayNumber))
    const missingDays = Array.from({ length: detail.durationDays }, (_, index) => index + 1).filter(
      (day) => !configuredDays.has(day)
    )
    if (missingDays.length > 0) {
      ElMessage.warning(`Complete daily content for day(s): ${missingDays.join(', ')}.`)
      activeChallenge.value = detail
      dayNumber.value = missingDays[0]
      selectDay(dayNumber.value)
      daysVisible.value = true
      return
    }

    const invalidWorkoutDay = detail.days.find(
      (day) =>
        day.trackingMode === 'workout' &&
        (!day.workoutMetric || !day.targetValue || day.targetValue <= 0)
    )
    if (invalidWorkoutDay) {
      ElMessage.warning(`Complete the workout metric and target for day ${invalidWorkoutDay.dayNumber}.`)
      activeChallenge.value = detail
      dayNumber.value = invalidWorkoutDay.dayNumber
      selectDay(dayNumber.value)
      daysVisible.value = true
      return
    }

    await ElMessageBox.confirm(
      'Publishing makes this challenge available to users. Continue?',
      'Publish Challenge'
    )
    await publishCommunityChallenge(item.id)
    ElMessage.success('Challenge published.')
    loadChallenges()
  }
  const archive = async (item: CommunityChallenge) => {
    await ElMessageBox.confirm(
      'Archiving removes the challenge from the user catalog but preserves participation history.',
      'Archive Challenge',
      { type: 'warning' }
    )
    await archiveCommunityChallenge(item.id)
    ElMessage.success('Challenge archived.')
    loadChallenges()
  }
  const domainLabel = (value: CommunityDomain) =>
    domains.find((v) => v.value === value)?.label || value
  const contentProgress = (item: CommunityChallenge) =>
    Math.round(Math.min(100, (item.dayCount / item.durationDays) * 100))
  const statusLabel = (value: string) =>
    ({ draft: 'Draft', published: 'Published', archived: 'Archived' })[value] || value
  const statusType = (value: string) =>
    value === 'published' ? 'success' : value === 'archived' ? 'info' : 'warning'
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
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

  .expert-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 20px;

    strong,
    small {
      display: block;
    }

    small {
      margin-top: 4px;
      color: var(--el-text-color-secondary);
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
