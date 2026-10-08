<template>
  <div class="guide-page art-full-height">
    <header class="page-heading"
      ><div
        ><p class="eyebrow">BODY FOUNDATIONS</p><h1>{{ t('content.guidance.title') }}</h1
        ><p>{{ t('content.guidance.subtitle') }}</p></div
      ><div class="heading-actions"
        ><ElTag :type="guide.status === 'published' ? 'success' : 'warning'">{{
          t(`content.status.${guide.status}`)
        }}</ElTag
        ><ElButton type="primary" :loading="saving" @click="saveProgram">{{
          t('content.guidance.saveProgram')
        }}</ElButton></div
      ></header
    >
    <ElRow :gutter="16" class="summary-row"
      ><ElCol :xs="24" :lg="9"
        ><ElCard shadow="never" class="program-card"
          ><template #header
            ><div class="card-header"
              ><strong>{{ t('content.guidance.programSettings') }}</strong
              ><span>v{{ guide.version }}</span></div
            ></template
          ><ElForm label-position="top"
            ><ElFormItem :label="t('content.common.status')"
              ><ElRadioGroup v-model="guide.status"
                ><ElRadioButton value="draft">{{ t('content.status.draft') }}</ElRadioButton
                ><ElRadioButton value="published">{{
                  t('content.status.published')
                }}</ElRadioButton></ElRadioGroup
              ></ElFormItem
            ><ElFormItem :label="t('content.common.defaultLanguage')"
              ><ElSelect v-model="guide.defaultLocale"
                ><ElOption
                  v-for="item in localeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value" /></ElSelect></ElFormItem
            ><ElTabs v-model="programLocale"
              ><ElTabPane v-for="loc in locales" :key="loc" :name="loc" :label="localeLabel(loc)"
                ><ElFormItem :label="t('content.common.title')"
                  ><ElInput v-model="programTranslations[loc].title" /></ElFormItem
                ><ElFormItem :label="t('content.common.subtitle')"
                  ><ElInput v-model="programTranslations[loc].subtitle" /></ElFormItem
                ><ElFormItem :label="t('content.common.description')"
                  ><ElInput
                    v-model="programTranslations[loc].description"
                    type="textarea"
                    :rows="5" /></ElFormItem></ElTabPane></ElTabs></ElForm></ElCard
      ></ElCol>
      <ElCol :xs="24" :lg="15"
        ><ElCard shadow="never" class="days-card art-table-card"
          ><template #header
            ><div class="card-header"
              ><div
                ><strong>{{ t('content.guidance.dayContent') }}</strong
                ><span>{{
                  t('content.guidance.configured', {
                    count: guide.days.length,
                    total: guide.totalDays
                  })
                }}</span></div
              ></div
            ></template
          ><ArtTable :loading="loading" :data="dayRows" row-key="dayNumber"
            ><ElTableColumn prop="dayNumber" :label="t('content.guidance.day')" width="80"
              ><template #default="{ row }">{{
                t('content.guidance.dayNumber', { day: row.dayNumber })
              }}</template></ElTableColumn
            ><ElTableColumn :label="t('content.common.title')" min-width="220"
              ><template #default="{ row }"
                ><strong>{{ dayTitle(row) }}</strong
                ><div class="secondary">{{
                  row.actionRoute || t('content.guidance.noRoute')
                }}</div></template
              ></ElTableColumn
            ><ElTableColumn
              prop="icon"
              :label="t('content.common.icon')"
              min-width="170"
            /><ElTableColumn :label="t('content.common.enabled')" width="90"
              ><template #default="{ row }"
                ><ElTag :type="row.isEnabled ? 'success' : 'info'">{{
                  row.isEnabled ? t('content.common.yes') : t('content.common.no')
                }}</ElTag></template
              ></ElTableColumn
            ><ElTableColumn :label="t('content.common.actions')" width="90"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openDay(row)">{{
                  t('content.common.edit')
                }}</ElButton></template
              ></ElTableColumn
            ></ArtTable
          ></ElCard
        ></ElCol
      ></ElRow
    >
    <ElDrawer
      v-model="dayVisible"
      :title="t('content.guidance.editDay', { day: dayForm.dayNumber })"
      size="720px"
      destroy-on-close
      ><ElAlert
        :title="t('content.guidance.routeTip')"
        type="info"
        :closable="false"
        show-icon
      /><ElForm label-position="top" class="day-form"
        ><div class="form-grid"
          ><ElFormItem :label="t('content.common.icon')"
            ><ElInput v-model="dayForm.icon" placeholder="ri:moon-clear-line" /></ElFormItem
          ><ElFormItem :label="t('content.guidance.actionRoute')"
            ><ElInput v-model="dayForm.actionRoute" placeholder="/sleep" /></ElFormItem
          ><ElFormItem :label="t('content.common.enabled')"
            ><ElSwitch v-model="dayForm.isEnabled" /></ElFormItem></div
        ><ElTabs v-model="dayLocale" type="border-card"
          ><ElTabPane v-for="loc in locales" :key="loc" :name="loc" :label="localeLabel(loc)"
            ><ElFormItem :label="t('content.common.title')"
              ><ElInput v-model="dayTranslations[loc].title" /></ElFormItem
            ><ElFormItem :label="t('content.common.summary')"
              ><ElInput
                v-model="dayTranslations[loc].summary"
                type="textarea"
                :rows="2" /></ElFormItem
            ><ElFormItem :label="t('content.guidance.actionText')"
              ><ElInput v-model="dayTranslations[loc].actionText" /></ElFormItem
            ><ElFormItem :label="t('content.guidance.lessonContent')"
              ><ArtWangEditor
                v-model="dayTranslations[loc].content"
                height="300px"
                :placeholder="
                  t('content.guidance.contentPlaceholder')
                " /></ElFormItem></ElTabPane></ElTabs></ElForm
      ><template #footer
        ><ElButton @click="dayVisible = false">{{ t('common.cancel') }}</ElButton
        ><ElButton type="primary" :loading="savingDay" @click="saveDay">{{
          t('content.common.save')
        }}</ElButton></template
      ></ElDrawer
    >
  </div>
</template>
<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import {
    fetchGuideContent,
    saveGuideContent,
    saveGuideDay,
    type ContentLocale,
    type GuideContent,
    type GuideDay,
    type GuideDayTranslation,
    type GuideTranslation
  } from '@/api/content'
  defineOptions({ name: 'GuidanceManagement' })
  const { t, locale } = useI18n()
  const locales: ContentLocale[] = ['zh', 'en', 'pt']
  const localeOptions = computed(() =>
    locales.map((value) => ({ value, label: t(`content.languages.${value}`) }))
  )
  const localeLabel = (value: string) => t(`content.languages.${value}`)
  const emptyProgram = (loc: ContentLocale): GuideTranslation => ({
    locale: loc,
    title: '',
    subtitle: '',
    description: ''
  })
  const emptyDayTranslation = (loc: ContentLocale): GuideDayTranslation => ({
    locale: loc,
    title: '',
    summary: '',
    content: '',
    actionText: ''
  })
  const guide = reactive<GuideContent>({
    programKey: 'body_foundations',
    version: 1,
    defaultLocale: 'zh',
    totalDays: 14,
    status: 'draft',
    translations: [],
    days: []
  })
  const programTranslations = reactive<Record<ContentLocale, GuideTranslation>>({
    zh: emptyProgram('zh'),
    en: emptyProgram('en'),
    pt: emptyProgram('pt')
  })
  const dayTranslations = reactive<Record<ContentLocale, GuideDayTranslation>>({
    zh: emptyDayTranslation('zh'),
    en: emptyDayTranslation('en'),
    pt: emptyDayTranslation('pt')
  })
  const loading = ref(false),
    saving = ref(false),
    savingDay = ref(false),
    dayVisible = ref(false),
    programLocale = ref<ContentLocale>('zh'),
    dayLocale = ref<ContentLocale>('zh')
  const dayForm = reactive({
    dayNumber: 1,
    icon: 'ri:heart-pulse-line',
    actionRoute: '',
    isEnabled: true
  })
  const dayRows = computed(() =>
    Array.from(
      { length: guide.totalDays },
      (_, i) =>
        guide.days.find((x) => x.dayNumber === i + 1) || {
          dayNumber: i + 1,
          icon: 'ri:heart-pulse-line',
          actionRoute: '',
          isEnabled: true,
          translations: []
        }
    )
  )
  const dayTitle = (day: GuideDay) =>
    day.translations.find((x) => x.locale === locale.value)?.title ||
    day.translations.find((x) => x.locale === guide.defaultLocale)?.title ||
    t('content.guidance.notConfigured')
  const apply = (data: GuideContent) => {
    Object.assign(guide, data)
    locales.forEach((loc) =>
      Object.assign(
        programTranslations[loc],
        data.translations.find((x) => x.locale === loc) || emptyProgram(loc)
      )
    )
  }
  const load = async () => {
    loading.value = true
    try {
      apply(await fetchGuideContent())
    } finally {
      loading.value = false
    }
  }
  const saveProgram = async () => {
    const translations = locales
      .map((loc) => programTranslations[loc])
      .filter((x) => x.title.trim() || x.description.trim())
    if (
      !translations.length ||
      translations.some((x) => !x.title.trim() || !x.description.trim()) ||
      !translations.some((x) => x.locale === guide.defaultLocale)
    ) {
      ElMessage.warning(t('content.validation.defaultTranslation'))
      return
    }
    saving.value = true
    try {
      apply(
        await saveGuideContent({
          defaultLocale: guide.defaultLocale,
          status: guide.status,
          translations
        })
      )
      ElMessage.success(t('content.messages.saved'))
    } finally {
      saving.value = false
    }
  }
  const openDay = (day: GuideDay) => {
    Object.assign(dayForm, {
      dayNumber: day.dayNumber,
      icon: day.icon,
      actionRoute: day.actionRoute,
      isEnabled: day.isEnabled
    })
    locales.forEach((loc) =>
      Object.assign(
        dayTranslations[loc],
        day.translations.find((x) => x.locale === loc) || emptyDayTranslation(loc)
      )
    )
    dayLocale.value = guide.defaultLocale
    dayVisible.value = true
  }
  const saveDay = async () => {
    const translations = locales
      .map((loc) => dayTranslations[loc])
      .filter((x) => x.title.trim() || x.content.trim())
    if (!translations.length || translations.some((x) => !x.title.trim() || !x.content.trim())) {
      ElMessage.warning(t('content.validation.required'))
      return
    }
    savingDay.value = true
    try {
      apply(
        await saveGuideDay(dayForm.dayNumber, {
          icon: dayForm.icon,
          actionRoute: dayForm.actionRoute,
          isEnabled: dayForm.isEnabled,
          translations
        })
      )
      ElMessage.success(t('content.messages.saved'))
      dayVisible.value = false
    } finally {
      savingDay.value = false
    }
  }
  onMounted(load)
</script>
<style scoped lang="scss">
  .guide-page {
    padding: 20px;
  }
  .page-heading,
  .card-header,
  .heading-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .page-heading {
    margin-bottom: 18px;
  }
  .page-heading h1 {
    margin: 4px 0;
    font-size: 28px;
  }
  .page-heading p,
  .secondary,
  .card-header span {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: var(--el-color-primary) !important;
  }
  .program-card,
  .days-card {
    height: calc(100vh - 180px);
    overflow: auto;
  }
  .card-header > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .card-header span,
  .secondary {
    font-size: 12px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;
  }
  .day-form {
    margin-top: 18px;
  }
  :deep(.el-select) {
    width: 100%;
  }
  @media (max-width: 1200px) {
    .program-card,
    .days-card {
      height: auto;
      margin-bottom: 16px;
    }
  }
  @media (max-width: 720px) {
    .guide-page {
      padding: 12px;
    }
    .page-heading {
      align-items: flex-start;
      flex-direction: column;
    }
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
