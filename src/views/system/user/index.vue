<template>
  <div class="user-page art-full-height">
    <div class="page-heading">
      <div>
        <p class="eyebrow">BYND</p>
        <h1>{{ t('userAdmin.title') }}</h1>
        <p class="subtitle">{{ t('userAdmin.subtitle') }}</p>
      </div>
      <ElButton type="primary" size="large" @click="openCreate">{{
        t('userAdmin.create')
      }}</ElButton>
    </div>

    <ElCard shadow="never" class="filter-card">
      <div class="filters">
        <ElInput
          v-model="filters.keyword"
          clearable
          :placeholder="t('userAdmin.searchPlaceholder')"
          @keyup.enter="search"
        />
        <ElSelect v-model="filters.status" clearable :placeholder="t('userAdmin.fields.status')">
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElButton type="primary" @click="search">{{ t('userAdmin.search') }}</ElButton>
        <ElButton @click="reset">{{ t('userAdmin.reset') }}</ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never" class="table-card">
      <div class="table-meta">
        <span>{{ t('userAdmin.total', { count: total }) }}</span>
        <ElButton :loading="loading" text @click="loadUsers">{{ t('userAdmin.refresh') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="users" row-key="id" class="users-table">
        <ElTableColumn :label="t('userAdmin.columns.user')" min-width="250" fixed="left">
          <template #default="{ row }">
            <div class="identity">
              <ElAvatar :size="42" :src="row.avatarUrl || undefined">{{ initials(row) }}</ElAvatar>
              <div class="identity-copy">
                <strong :title="displayName(row)">{{ displayName(row) }}</strong>
                <span :title="row.email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="phone"
          :label="t('userAdmin.fields.phone')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('userAdmin.fields.status')" min-width="130">
          <template #default="{ row }"
            ><ElTag :type="statusType(row.status)" effect="light">{{
              statusLabel(row.status)
            }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn
          prop="locale"
          :label="t('userAdmin.fields.locale')"
          min-width="130"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="timezone"
          :label="t('userAdmin.fields.timezone')"
          min-width="170"
          show-overflow-tooltip
        />
        <ElTableColumn :label="t('userAdmin.columns.measurements')" min-width="190">
          <template #default="{ row }">{{ measurementText(row) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('userAdmin.fields.lastLoginAt')" min-width="185">
          <template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('userAdmin.fields.createdAt')" min-width="185">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('userAdmin.columns.actions')" min-width="200" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <ElButton link type="primary" @click="openEdit(row)">{{
                t('userAdmin.edit')
              }}</ElButton>
              <ElButton
                link
                type="danger"
                :disabled="row.status === 4"
                @click="confirmDeactivate(row)"
              >
                {{ t('userAdmin.deactivate') }}
              </ElButton>
            </div>
          </template>
        </ElTableColumn>
        <template #empty><ElEmpty :description="t('userAdmin.empty')" /></template>
      </ElTable>
      <div class="pagination-wrap">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="loadUsers"
          @size-change="handlePageSize"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? t('userAdmin.editTitle') : t('userAdmin.createTitle')"
      class="user-dialog"
      width="min(760px, calc(100vw - 32px))"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" status-icon>
        <div class="form-grid">
          <ElFormItem :label="t('userAdmin.fields.email')" prop="email"
            ><ElInput v-model="form.email" maxlength="255"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.fullName')" prop="fullName"
            ><ElInput v-model="form.fullName" maxlength="120"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.username')"
            ><ElInput v-model="form.username" maxlength="80"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.phone')"
            ><ElInput v-model="form.phone" maxlength="32"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.birthDate')"
            ><ElDatePicker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.biologicalSex')">
            <ElSelect v-model="form.biologicalSex" clearable
              ><ElOption
                v-for="option in sexOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
            /></ElSelect>
          </ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.genderIdentity')"
            ><ElInput v-model="form.genderIdentity" maxlength="64"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.locale')" prop="locale">
            <ElSelect v-model="form.locale" filterable allow-create>
              <ElOption label="English (en-US)" value="en-US" /><ElOption
                label="Português (pt-BR)"
                value="pt-BR"
              /><ElOption label="中文 (zh-CN)" value="zh-CN" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.timezone')" prop="timezone"
            ><ElInput
              v-model="form.timezone"
              :placeholder="t('userAdmin.timezonePlaceholder')"
              maxlength="64"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.status')">
            <ElSelect v-model="form.status"
              ><ElOption
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
            /></ElSelect>
          </ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.heightCm')"
            ><ElInputNumber
              v-model="form.heightCm"
              :min="30"
              :max="300"
              :precision="1"
              controls-position="right"
          /></ElFormItem>
          <ElFormItem :label="t('userAdmin.fields.weightKg')"
            ><ElInputNumber
              v-model="form.weightKg"
              :min="1"
              :max="1000"
              :precision="1"
              controls-position="right"
          /></ElFormItem>
          <ElFormItem class="full-span" :label="t('userAdmin.fields.avatarUrl')"
            ><ElInput v-model="form.avatarUrl" maxlength="2048"
          /></ElFormItem>
        </div>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">{{
          t('userAdmin.save')
        }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, TagProps } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import {
    createUser,
    deactivateUser,
    fetchUser,
    fetchUsers,
    updateUser,
    type CmsUser,
    type CmsUserPayload
  } from '@/api/system-manage'

  defineOptions({ name: 'User' })
  const { t, locale } = useI18n()
  const loading = ref(false),
    saving = ref(false),
    dialogVisible = ref(false)
  const users = ref<CmsUser[]>([]),
    total = ref(0),
    page = ref(1),
    pageSize = ref(20)
  const filters = reactive<{ keyword: string; status?: number }>({ keyword: '', status: undefined })
  const editingId = ref(''),
    formRef = ref<FormInstance>()
  const emptyForm = (): CmsUserPayload => ({
    email: '',
    phone: '',
    username: '',
    fullName: '',
    avatarUrl: '',
    birthDate: '',
    biologicalSex: '',
    genderIdentity: '',
    locale: 'en-US',
    timezone: 'UTC',
    heightCm: null,
    weightKg: null,
    status: 1
  })
  const form = reactive<CmsUserPayload>(emptyForm())
  const statusOptions = computed(() =>
    [0, 1, 2, 3, 4].map((value) => ({ value, label: t(`userAdmin.status.${value}`) }))
  )
  const sexOptions = computed(() =>
    ['female', 'male', 'intersex', 'unknown', 'prefer_not_to_say'].map((value) => ({
      value,
      label: t(`userAdmin.sex.${value}`)
    }))
  )
  const rules = computed<FormRules>(() => ({
    email: [
      { required: true, message: t('userAdmin.validation.emailRequired'), trigger: 'blur' },
      { type: 'email', message: t('userAdmin.validation.emailInvalid'), trigger: 'blur' }
    ],
    fullName: [
      { required: true, message: t('userAdmin.validation.fullNameRequired'), trigger: 'blur' }
    ],
    locale: [
      { required: true, message: t('userAdmin.validation.localeRequired'), trigger: 'change' }
    ],
    timezone: [
      { required: true, message: t('userAdmin.validation.timezoneRequired'), trigger: 'blur' }
    ]
  }))

  async function loadUsers() {
    loading.value = true
    try {
      const result = await fetchUsers({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword.trim() || undefined,
        status: filters.status
      })
      users.value = result.items
      total.value = result.total
    } finally {
      loading.value = false
    }
  }
  function search() {
    page.value = 1
    loadUsers()
  }
  function reset() {
    filters.keyword = ''
    filters.status = undefined
    search()
  }
  function handlePageSize() {
    page.value = 1
    loadUsers()
  }
  function resetForm(value: CmsUserPayload) {
    Object.assign(form, emptyForm(), value)
  }
  function openCreate() {
    editingId.value = ''
    resetForm(emptyForm())
    dialogVisible.value = true
  }
  async function openEdit(row: CmsUser) {
    loading.value = true
    try {
      const d = await fetchUser(row.id)
      editingId.value = d.id
      resetForm({
        email: d.email,
        phone: d.phone,
        username: d.username,
        fullName: d.fullName,
        avatarUrl: d.avatarUrl,
        birthDate: d.birthDate,
        biologicalSex: d.biologicalSex,
        genderIdentity: d.genderIdentity,
        locale: d.locale,
        timezone: d.timezone,
        heightCm: d.heightCm,
        weightKg: d.weightKg,
        status: d.status
      })
      dialogVisible.value = true
    } finally {
      loading.value = false
    }
  }
  async function save() {
    if (!formRef.value || !(await formRef.value.validate().catch(() => false))) return
    saving.value = true
    try {
      if (editingId.value) await updateUser(editingId.value, { ...form })
      else await createUser({ ...form })
      ElMessage.success(t('userAdmin.messages.saved'))
      dialogVisible.value = false
      await loadUsers()
    } finally {
      saving.value = false
    }
  }
  async function confirmDeactivate(row: CmsUser) {
    await ElMessageBox.confirm(
      t('userAdmin.confirmDeactivate', { name: displayName(row) }),
      t('userAdmin.deactivateTitle'),
      {
        type: 'warning',
        confirmButtonText: t('userAdmin.deactivate'),
        cancelButtonText: t('common.cancel')
      }
    )
    await deactivateUser(row.id)
    ElMessage.success(t('userAdmin.messages.deactivated'))
    await loadUsers()
  }
  function displayName(row: CmsUser) {
    return row.fullName || row.username || row.email
  }
  function initials(row: CmsUser) {
    return displayName(row).trim().slice(0, 2).toUpperCase()
  }
  function statusLabel(status: number) {
    return t(`userAdmin.status.${status}`)
  }
  function statusType(status: number): TagProps['type'] {
    return (
      ({ 0: 'info', 1: 'success', 2: 'warning', 3: 'danger', 4: 'info' } as const)[status] || 'info'
    )
  }
  function measurementText(row: CmsUser) {
    const values = []
    if (row.heightCm != null) values.push(`${row.heightCm} cm`)
    if (row.weightKg != null) values.push(`${row.weightKg} kg`)
    return values.join(' · ') || '—'
  }
  function formatDate(value: string) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(
          date
        )
  }
  onMounted(loadUsers)
</script>

<style scoped lang="scss">
  .user-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .page-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 8px 2px;
  }
  .eyebrow {
    margin: 0 0 6px;
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
  }
  h1 {
    margin: 0;
    font-size: clamp(24px, 3vw, 34px);
    line-height: 1.15;
  }
  .subtitle {
    max-width: 720px;
    margin: 8px 0 0;
    color: var(--el-text-color-secondary);
    line-height: 1.55;
  }
  .filter-card,
  .table-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
  }
  .filters {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(180px, 240px) auto auto;
    gap: 12px;
  }
  .table-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
  }
  .identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
  }
  .identity-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;
  }
  .identity-copy strong,
  .identity-copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .identity-copy span {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .row-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    overflow-x: auto;
    padding-top: 18px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 20px;
  }
  .full-span {
    grid-column: 1 / -1;
  }
  :deep(.el-select),
  :deep(.el-date-editor),
  :deep(.el-input-number) {
    width: 100%;
  }
  :deep(.el-table th .cell) {
    line-height: 1.25;
    white-space: normal;
    word-break: normal;
  }
  :deep(.user-dialog .el-dialog__body) {
    max-height: min(68vh, 680px);
    overflow-y: auto;
  }
  @media (max-width: 760px) {
    .page-heading {
      align-items: stretch;
      flex-direction: column;
    }
    .filters {
      grid-template-columns: 1fr 1fr;
    }
    .filters :deep(.el-input),
    .filters :deep(.el-select) {
      grid-column: 1 / -1;
    }
    .form-grid {
      grid-template-columns: 1fr;
    }
    .full-span {
      grid-column: auto;
    }
  }
</style>
