<template>
  <div class="content-page art-full-height">
    <header class="page-heading"
      ><div
        ><p class="eyebrow">BYND LIBRARY</p><h1>{{ t('content.reading.title') }}</h1
        ><p>{{ t('content.reading.subtitle') }}</p></div
      ></header
    >
    <ElTabs v-model="tab" class="content-tabs">
      <ElTabPane :label="t('content.reading.publications')" name="publications">
        <ElCard shadow="never" class="art-table-card">
          <ArtTableHeader :loading="loading" @refresh="loadPublications"
            ><template #left
              ><div class="toolbar"
                ><ElSelect
                  v-model="statusFilter"
                  clearable
                  :placeholder="t('content.common.status')"
                  @change="searchPublications"
                  ><ElOption
                    v-for="status in statuses"
                    :key="status"
                    :label="t(`content.status.${status}`)"
                    :value="status" /></ElSelect
                ><ElButton type="primary" @click="openPublication()">{{
                  t('content.reading.newPublication')
                }}</ElButton></div
              ></template
            ></ArtTableHeader
          >
          <ArtTable
            :loading="loading"
            :data="publications"
            :pagination="pagination"
            row-key="id"
            @pagination:size-change="changePageSize"
            @pagination:current-change="changePage"
          >
            <ElTableColumn :label="t('content.reading.book')" min-width="280"
              ><template #default="{ row }"
                ><div class="book-cell"
                  ><ElImage
                    v-if="assetUrl(row.coverAssetId)"
                    :src="assetUrl(row.coverAssetId)"
                    fit="cover"
                  /><div v-else class="cover-placeholder">BYND</div
                  ><div
                    ><strong>{{
                      translation(row.translations, row.defaultLocale)?.title || row.slug
                    }}</strong
                    ><small>{{ row.author }} · {{ row.slug }}</small></div
                  ></div
                ></template
              ></ElTableColumn
            >
            <ElTableColumn :label="t('content.reading.type')" width="100"
              ><template #default="{ row }"
                ><ElTag>{{ t(`content.reading.types.${row.contentType}`) }}</ElTag></template
              ></ElTableColumn
            >
            <ElTableColumn :label="t('content.reading.category')" width="150"
              ><template #default="{ row }">{{
                categoryName(row.categoryId)
              }}</template></ElTableColumn
            >
            <ElTableColumn :label="t('content.reading.recommended')" width="110"
              ><template #default="{ row }"
                ><ElTag :type="row.isFeatured ? 'warning' : 'info'">{{
                  row.isFeatured ? t('content.common.yes') : t('content.common.no')
                }}</ElTag></template
              ></ElTableColumn
            >
            <ElTableColumn :label="t('content.common.status')" width="110"
              ><template #default="{ row }"
                ><ElTag :type="statusType(row.status)">{{
                  t(`content.status.${row.status}`)
                }}</ElTag></template
              ></ElTableColumn
            >
            <ElTableColumn :label="t('content.common.updatedAt')" width="180"
              ><template #default="{ row }">{{
                formatDate(row.updatedAt)
              }}</template></ElTableColumn
            >
            <ElTableColumn :label="t('content.common.actions')" width="160" fixed="right"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openPublication(row)">{{
                  t('content.common.edit')
                }}</ElButton
                ><ElButton
                  v-if="row.status !== 'archived'"
                  link
                  type="danger"
                  @click="archivePublication(row)"
                  >{{ t('content.common.archive') }}</ElButton
                ></template
              ></ElTableColumn
            >
          </ArtTable>
        </ElCard>
      </ElTabPane>
      <ElTabPane :label="t('content.reading.categories')" name="categories">
        <ElCard shadow="never" class="art-table-card"
          ><ArtTableHeader :loading="loadingCategories" @refresh="loadCategories"
            ><template #left
              ><ElButton type="primary" @click="openCategory()">{{
                t('content.reading.newCategory')
              }}</ElButton></template
            ></ArtTableHeader
          >
          <ArtTable :loading="loadingCategories" :data="categories" row-key="id">
            <ElTableColumn
              prop="sortOrder"
              :label="t('content.common.sort')"
              width="80"
            /><ElTableColumn :label="t('content.reading.category')" min-width="240"
              ><template #default="{ row }"
                ><strong>{{ categoryName(row.id) }}</strong
                ><div class="secondary">{{ row.slug }}</div></template
              ></ElTableColumn
            ><ElTableColumn
              prop="icon"
              :label="t('content.common.icon')"
              min-width="160"
            /><ElTableColumn
              prop="colorKey"
              :label="t('content.common.color')"
              width="120"
            /><ElTableColumn :label="t('content.common.enabled')" width="100"
              ><template #default="{ row }"
                ><ElTag :type="row.isEnabled ? 'success' : 'info'">{{
                  row.isEnabled ? t('content.common.yes') : t('content.common.no')
                }}</ElTag></template
              ></ElTableColumn
            ><ElTableColumn :label="t('content.common.actions')" width="150"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openCategory(row)">{{
                  t('content.common.edit')
                }}</ElButton
                ><ElButton link type="danger" @click="removeCategory(row)">{{
                  t('content.common.delete')
                }}</ElButton></template
              ></ElTableColumn
            >
          </ArtTable></ElCard
        >
      </ElTabPane>
      <ElTabPane :label="t('content.reading.assets')" name="assets">
        <ElCard shadow="never" class="art-table-card"
          ><ArtTableHeader :loading="loadingAssets" @refresh="loadAssets"
            ><template #left
              ><div class="toolbar"
                ><ReadingAssetUpload
                  kind="cover"
                  :label="t('content.reading.uploadCover')"
                  @uploaded="loadAssets" /><ReadingAssetUpload
                  kind="epub"
                  :label="t('content.reading.uploadEpub')"
                  @uploaded="loadAssets" /></div></template></ArtTableHeader
          ><ArtTable
            :loading="loadingAssets"
            :data="assets"
            :pagination="assetPagination"
            row-key="id"
            @pagination:current-change="changeAssetPage"
            ><ElTableColumn :label="t('content.reading.file')" min-width="280"
              ><template #default="{ row }"
                ><div class="file-cell"
                  ><ElImage v-if="row.kind === 'cover' && row.url" :src="row.url" fit="cover" /><div
                    ><strong>{{ row.originalFilename }}</strong
                    ><small>{{ formatBytes(row.fileSizeBytes) }}</small></div
                  ></div
                ></template
              ></ElTableColumn
            ><ElTableColumn
              prop="kind"
              :label="t('content.reading.assetType')"
              width="110"
            /><ElTableColumn prop="mediaType" label="MIME" min-width="180" /><ElTableColumn
              :label="t('content.common.createdAt')"
              width="180"
              ><template #default="{ row }">{{
                formatDate(row.createdAt)
              }}</template></ElTableColumn
            ><ElTableColumn :label="t('content.common.actions')" width="90"
              ><template #default="{ row }"
                ><ElButton link type="danger" @click="removeAsset(row)">{{
                  t('content.common.delete')
                }}</ElButton></template
              ></ElTableColumn
            ></ArtTable
          ></ElCard
        >
      </ElTabPane>
    </ElTabs>

    <ElDrawer
      v-model="publicationVisible"
      :title="
        editingPublicationId
          ? t('content.reading.editPublication')
          : t('content.reading.newPublication')
      "
      size="760px"
      destroy-on-close
    >
      <ElForm label-position="top" :model="publicationForm"
        ><div class="form-grid"
          ><ElFormItem label="Slug"
            ><ElInput v-model="publicationForm.slug" placeholder="sleep-better" /></ElFormItem
          ><ElFormItem :label="t('content.reading.type')"
            ><ElSelect v-model="publicationForm.contentType"
              ><ElOption :label="t('content.reading.types.article')" value="article" /><ElOption
                :label="t('content.reading.types.epub')"
                value="epub" /></ElSelect></ElFormItem
          ><ElFormItem :label="t('content.reading.category')"
            ><ElSelect v-model="publicationForm.categoryId"
              ><ElOption
                v-for="item in categories"
                :key="item.id"
                :label="categoryName(item.id)"
                :value="item.id" /></ElSelect></ElFormItem
          ><ElFormItem :label="t('content.reading.author')"
            ><ElInput v-model="publicationForm.author" /></ElFormItem
          ><ElFormItem :label="t('content.reading.publisher')"
            ><ElInput v-model="publicationForm.publisher" /></ElFormItem
          ><ElFormItem label="ISBN-13"
            ><ElInput v-model="publicationForm.isbn13" maxlength="13" /></ElFormItem
          ><ElFormItem :label="t('content.reading.readMinutes')"
            ><ElInputNumber
              v-model="publicationForm.estimatedReadMinutes"
              :min="1"
              :max="1440" /></ElFormItem
          ><ElFormItem :label="t('content.common.sort')"
            ><ElInputNumber v-model="publicationForm.sortOrder" /></ElFormItem
          ><ElFormItem :label="t('content.common.status')"
            ><ElSelect v-model="publicationForm.status"
              ><ElOption
                v-for="status in statuses"
                :key="status"
                :label="t(`content.status.${status}`)"
                :value="status" /></ElSelect></ElFormItem
          ><ElFormItem :label="t('content.reading.access')"
            ><ElSelect v-model="publicationForm.accessTier"
              ><ElOption :label="t('content.reading.free')" value="free" /><ElOption
                :label="t('content.reading.premium')"
                value="premium" /></ElSelect></ElFormItem
          ><ElFormItem :label="t('content.reading.recommended')"
            ><ElSwitch v-model="publicationForm.isFeatured" /></ElFormItem
          ><ElFormItem :label="t('content.reading.cover')"
            ><ReadingAssetUpload
              v-model="selectedCover"
              kind="cover"
              :label="t('content.reading.uploadCover')" /></ElFormItem
        ></div>
        <ElDivider>{{ t('content.common.translations') }}</ElDivider
        ><div class="locale-options"
          ><span>{{ t('content.common.enabledLanguages') }}</span
          ><ElCheckboxGroup v-model="activeLocales"
            ><ElCheckbox
              v-for="item in localeOptions"
              :key="item.value"
              :value="item.value"
              :disabled="item.value === publicationForm.defaultLocale"
              >{{ item.label }}</ElCheckbox
            ></ElCheckboxGroup
          ><ElSelect v-model="publicationForm.defaultLocale" @change="ensureDefaultLocale"
            ><ElOption
              v-for="item in localeOptions"
              :key="item.value"
              :label="`${t('content.common.defaultLanguage')}: ${item.label}`"
              :value="item.value" /></ElSelect
        ></div>
        <ElTabs v-model="editingLocale" type="border-card"
          ><ElTabPane
            v-for="locale in activeLocales"
            :key="locale"
            :name="locale"
            :label="localeLabel(locale)"
            ><div class="form-grid"
              ><ElFormItem class="wide" :label="t('content.common.title')"
                ><ElInput v-model="publicationTranslations[locale].title" /></ElFormItem
              ><ElFormItem class="wide" :label="t('content.common.subtitle')"
                ><ElInput v-model="publicationTranslations[locale].subtitle" /></ElFormItem
              ><ElFormItem class="wide" :label="t('content.common.summary')"
                ><ElInput
                  v-model="publicationTranslations[locale].summary"
                  type="textarea"
                  :rows="3" /></ElFormItem
              ><ElFormItem class="wide" :label="t('content.reading.keywords')"
                ><ElInput v-model="publicationTranslations[locale].searchKeywords" /></ElFormItem
              ><ElFormItem
                v-if="publicationForm.contentType === 'epub'"
                class="wide"
                :label="t('content.reading.epubFile')"
                ><ReadingAssetUpload
                  v-model="selectedEpub[locale]"
                  kind="epub"
                  :label="t('content.reading.uploadEpub')" /></ElFormItem
              ><ElFormItem v-else class="wide" :label="t('content.reading.body')"
                ><ArtWangEditor
                  v-model="publicationTranslations[locale].body"
                  height="320px"
                  :placeholder="
                    t('content.reading.bodyPlaceholder')
                  " /></ElFormItem></div></ElTabPane
        ></ElTabs> </ElForm
      ><template #footer
        ><ElButton @click="publicationVisible = false">{{ t('common.cancel') }}</ElButton
        ><ElButton type="primary" :loading="saving" @click="savePublication">{{
          t('content.common.save')
        }}</ElButton></template
      >
    </ElDrawer>

    <ElDialog
      v-model="categoryVisible"
      :title="
        editingCategoryId ? t('content.reading.editCategory') : t('content.reading.newCategory')
      "
      width="620px"
      ><ElForm label-position="top" :model="categoryForm"
        ><div class="form-grid"
          ><ElFormItem label="Slug"><ElInput v-model="categoryForm.slug" /></ElFormItem
          ><ElFormItem :label="t('content.common.icon')"
            ><ElInput v-model="categoryForm.icon" placeholder="ri:book-open-line" /></ElFormItem
          ><ElFormItem :label="t('content.common.color')"
            ><ElInput v-model="categoryForm.colorKey" placeholder="mist" /></ElFormItem
          ><ElFormItem :label="t('content.common.sort')"
            ><ElInputNumber v-model="categoryForm.sortOrder" /></ElFormItem
          ><ElFormItem :label="t('content.common.enabled')"
            ><ElSwitch v-model="categoryForm.isEnabled" /></ElFormItem></div
        ><ElTabs v-model="categoryLocale"
          ><ElTabPane
            v-for="locale in locales"
            :key="locale"
            :name="locale"
            :label="localeLabel(locale)"
            ><ElFormItem :label="t('content.common.name')"
              ><ElInput v-model="categoryTranslations[locale].name" /></ElFormItem
            ><ElFormItem :label="t('content.common.description')"
              ><ElInput
                v-model="categoryTranslations[locale].description"
                type="textarea"
                :rows="2" /></ElFormItem></ElTabPane></ElTabs></ElForm
      ><template #footer
        ><ElButton @click="categoryVisible = false">{{ t('common.cancel') }}</ElButton
        ><ElButton type="primary" :loading="saving" @click="saveCategory">{{
          t('content.common.save')
        }}</ElButton></template
      ></ElDialog
    >
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import ReadingAssetUpload from '@/components/business/content/ReadingAssetUpload.vue'
  import {
    archiveReadingPublication,
    createReadingCategory,
    createReadingPublication,
    deleteReadingAsset,
    deleteReadingCategory,
    fetchReadingAssets,
    fetchReadingCategories,
    fetchReadingPublication,
    fetchReadingPublications,
    updateReadingCategory,
    updateReadingPublication,
    type CategoryTranslation,
    type ContentLocale,
    type ReadingAsset,
    type ReadingCategory,
    type ReadingPublication,
    type ReadingTranslation
  } from '@/api/content'

  defineOptions({ name: 'ReadingManagement' })
  const { t, locale } = useI18n()
  const locales: ContentLocale[] = ['zh', 'en', 'pt']
  const statuses = ['draft', 'published', 'archived']
  const localeOptions = computed(() =>
    locales.map((value) => ({ value, label: t(`content.languages.${value}`) }))
  )
  const tab = ref('publications'),
    loading = ref(false),
    loadingCategories = ref(false),
    loadingAssets = ref(false),
    saving = ref(false),
    statusFilter = ref('')
  const publications = ref<ReadingPublication[]>([]),
    categories = ref<ReadingCategory[]>([]),
    assets = ref<ReadingAsset[]>([])
  const pagination = reactive({ current: 1, size: 20, total: 0 }),
    assetPagination = reactive({ current: 1, size: 20, total: 0 })
  const publicationVisible = ref(false),
    categoryVisible = ref(false),
    editingPublicationId = ref(''),
    editingCategoryId = ref(''),
    editingLocale = ref<ContentLocale>('zh'),
    categoryLocale = ref<ContentLocale>('zh'),
    activeLocales = ref<ContentLocale[]>(['zh']),
    selectedCover = ref<ReadingAsset>(),
    existingCoverAssetId = ref<string>(),
    selectedEpub = reactive<Partial<Record<ContentLocale, ReadingAsset>>>({})
  type EditorTranslation = Omit<ReadingTranslation, 'body'> & { body: string }
  const emptyTranslation = (locale: ContentLocale): EditorTranslation => ({
    locale,
    title: '',
    subtitle: '',
    summary: '',
    contentFormat: 'html',
    body: '',
    searchKeywords: ''
  })
  const publicationTranslations = reactive<Record<ContentLocale, EditorTranslation>>({
    zh: emptyTranslation('zh'),
    en: emptyTranslation('en'),
    pt: emptyTranslation('pt')
  })
  interface PublicationForm {
    slug: string
    contentType: 'article' | 'epub'
    categoryId: string
    defaultLocale: ContentLocale
    author: string
    publisher: string
    isbn13: string
    publishedOn?: string
    estimatedReadMinutes: number
    accessTier: 'free' | 'premium'
    status: 'draft' | 'published' | 'archived'
    isFeatured: boolean
    sortOrder: number
  }
  const blankPublication = (): PublicationForm => ({
    slug: '',
    contentType: 'article',
    categoryId: '',
    defaultLocale: 'zh',
    author: 'BYND Editorial',
    publisher: '',
    isbn13: '',
    publishedOn: undefined,
    estimatedReadMinutes: 5,
    accessTier: 'free',
    status: 'draft',
    isFeatured: false,
    sortOrder: 0
  })
  const publicationForm = reactive(blankPublication())
  const emptyCategoryTranslation = (locale: ContentLocale): CategoryTranslation => ({
    locale,
    name: '',
    description: ''
  })
  const categoryTranslations = reactive<Record<ContentLocale, CategoryTranslation>>({
    zh: emptyCategoryTranslation('zh'),
    en: emptyCategoryTranslation('en'),
    pt: emptyCategoryTranslation('pt')
  })
  const categoryForm = reactive({
    slug: '',
    icon: 'ri:book-open-line',
    colorKey: 'mist',
    sortOrder: 0,
    isEnabled: true
  })
  const translation = (items: ReadingTranslation[], preferred: string) =>
    items.find((x) => x.locale === preferred) || items.find((x) => x.locale === 'zh') || items[0]
  const categoryName = (id: string) => {
    const item = categories.value.find((x) => x.id === id)
    if (!item) return '—'
    return (
      item.translations.find((x) => x.locale === locale.value)?.name ||
      item.translations.find((x) => x.locale === 'zh')?.name ||
      item.slug
    )
  }
  const localeLabel = (value: string) => t(`content.languages.${value}`)
  const formatDate = (value: string) =>
    value
      ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(value)
        )
      : '—'
  const formatBytes = (value: number) =>
    value > 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`
  const statusType = (value: string) =>
    value === 'published' ? 'success' : value === 'archived' ? 'info' : 'warning'
  const assetUrl = (id?: string) => assets.value.find((x) => x.id === id)?.url
  const loadCategories = async () => {
    loadingCategories.value = true
    try {
      categories.value = (await fetchReadingCategories()).items
    } finally {
      loadingCategories.value = false
    }
  }
  const loadAssets = async () => {
    loadingAssets.value = true
    try {
      const r = await fetchReadingAssets({
        page: assetPagination.current,
        limit: assetPagination.size
      })
      assets.value = r.items
      assetPagination.total = r.pagination.total
    } finally {
      loadingAssets.value = false
    }
  }
  const loadPublications = async () => {
    loading.value = true
    try {
      const r = await fetchReadingPublications({
        page: pagination.current,
        limit: pagination.size,
        status: statusFilter.value || undefined
      })
      publications.value = r.items
      pagination.total = r.pagination.total
    } finally {
      loading.value = false
    }
  }
  const searchPublications = () => {
    pagination.current = 1
    loadPublications()
  }
  const changePage = (p: number) => {
    pagination.current = p
    loadPublications()
  }
  const changePageSize = (s: number) => {
    pagination.size = s
    pagination.current = 1
    loadPublications()
  }
  const changeAssetPage = (p: number) => {
    assetPagination.current = p
    loadAssets()
  }
  const resetTranslations = () =>
    locales.forEach((x) => Object.assign(publicationTranslations[x], emptyTranslation(x)))
  const openPublication = async (row?: ReadingPublication) => {
    Object.assign(publicationForm, blankPublication())
    resetTranslations()
    activeLocales.value = ['zh']
    selectedCover.value = undefined
    existingCoverAssetId.value = undefined
    locales.forEach((x) => delete selectedEpub[x])
    editingPublicationId.value = row?.id || ''
    if (row) {
      const detail = await fetchReadingPublication(row.id)
      Object.assign(publicationForm, {
        slug: detail.slug,
        contentType: detail.contentType,
        categoryId: detail.categoryId,
        defaultLocale: detail.defaultLocale,
        author: detail.author,
        publisher: detail.publisher || '',
        isbn13: detail.isbn13 || '',
        publishedOn: detail.publishedOn,
        estimatedReadMinutes: detail.estimatedReadMinutes,
        accessTier: detail.accessTier,
        status: detail.status,
        isFeatured: detail.isFeatured,
        sortOrder: detail.sortOrder
      })
      activeLocales.value = detail.translations.map((x) => x.locale)
      detail.translations.forEach((x) => Object.assign(publicationTranslations[x.locale], x))
      selectedCover.value = assets.value.find((x) => x.id === detail.coverAssetId)
      existingCoverAssetId.value = detail.coverAssetId
      detail.translations.forEach((x) => {
        if (x.contentAssetId)
          selectedEpub[x.locale] = assets.value.find((a) => a.id === x.contentAssetId)
      })
    }
    editingLocale.value = activeLocales.value[0] || 'zh'
    publicationVisible.value = true
  }
  const ensureDefaultLocale = (value: ContentLocale) => {
    if (!activeLocales.value.includes(value)) activeLocales.value.push(value)
    editingLocale.value = value
  }
  const savePublication = async () => {
    const trs = activeLocales.value.map((loc) => ({
      ...publicationTranslations[loc],
      contentFormat: publicationForm.contentType === 'epub' ? ('epub' as const) : ('html' as const),
      body:
        publicationForm.contentType === 'article' ? publicationTranslations[loc].body : undefined,
      contentAssetId:
        publicationForm.contentType === 'epub'
          ? selectedEpub[loc]?.id || publicationTranslations[loc].contentAssetId
          : undefined
    }))
    if (
      !publicationForm.slug ||
      !publicationForm.categoryId ||
      !publicationForm.author ||
      trs.some(
        (x) =>
          !x.title ||
          !x.summary ||
          (publicationForm.contentType === 'article' ? !x.body : !x.contentAssetId)
      )
    ) {
      ElMessage.warning(t('content.validation.required'))
      return
    }
    saving.value = true
    try {
      const payload = {
        ...publicationForm,
        publisher: publicationForm.publisher || undefined,
        isbn13: publicationForm.isbn13 || undefined,
        coverAssetId: selectedCover.value?.id || existingCoverAssetId.value,
        translations: trs
      }
      if (editingPublicationId.value)
        await updateReadingPublication(editingPublicationId.value, payload)
      else await createReadingPublication(payload)
      ElMessage.success(t('content.messages.saved'))
      publicationVisible.value = false
      await Promise.all([loadPublications(), loadAssets()])
    } finally {
      saving.value = false
    }
  }
  const openCategory = (row?: ReadingCategory) => {
    editingCategoryId.value = row?.id || ''
    Object.assign(
      categoryForm,
      row
        ? {
            slug: row.slug,
            icon: row.icon,
            colorKey: row.colorKey,
            sortOrder: row.sortOrder,
            isEnabled: row.isEnabled
          }
        : { slug: '', icon: 'ri:book-open-line', colorKey: 'mist', sortOrder: 0, isEnabled: true }
    )
    locales.forEach((x) =>
      Object.assign(
        categoryTranslations[x],
        row?.translations.find((v) => v.locale === x) || emptyCategoryTranslation(x)
      )
    )
    categoryLocale.value = 'zh'
    categoryVisible.value = true
  }
  const saveCategory = async () => {
    const translations = locales.map((x) => categoryTranslations[x]).filter((x) => x.name.trim())
    if (
      !categoryForm.slug ||
      !categoryForm.icon ||
      !categoryForm.colorKey ||
      !translations.length
    ) {
      ElMessage.warning(t('content.validation.required'))
      return
    }
    saving.value = true
    try {
      const payload = { ...categoryForm, translations }
      if (editingCategoryId.value) await updateReadingCategory(editingCategoryId.value, payload)
      else await createReadingCategory(payload)
      ElMessage.success(t('content.messages.saved'))
      categoryVisible.value = false
      await loadCategories()
    } finally {
      saving.value = false
    }
  }
  const archivePublication = async (row: ReadingPublication) => {
    await ElMessageBox.confirm(t('content.reading.archiveConfirm'), t('common.tips'))
    await archiveReadingPublication(row.id)
    ElMessage.success(t('content.messages.archived'))
    loadPublications()
  }
  const removeCategory = async (row: ReadingCategory) => {
    await ElMessageBox.confirm(t('content.reading.deleteCategoryConfirm'), t('common.tips'))
    await deleteReadingCategory(row.id)
    ElMessage.success(t('content.messages.deleted'))
    loadCategories()
  }
  const removeAsset = async (row: ReadingAsset) => {
    await ElMessageBox.confirm(t('content.reading.deleteAssetConfirm'), t('common.tips'))
    await deleteReadingAsset(row.id)
    ElMessage.success(t('content.messages.deleted'))
    loadAssets()
  }
  watch(tab, (value) => {
    if (value === 'categories') loadCategories()
    if (value === 'assets') loadAssets()
  })
  onMounted(() => Promise.all([loadCategories(), loadAssets(), loadPublications()]))
</script>

<style scoped lang="scss">
  .content-page {
    padding: 20px;
  }
  .page-heading {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .page-heading h1 {
    margin: 4px 0;
    font-size: 28px;
  }
  .page-heading p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: var(--el-color-primary) !important;
  }
  .content-tabs {
    height: calc(100% - 92px);
  }
  .toolbar,
  .locale-options {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .toolbar .el-select {
    width: 160px;
  }
  .book-cell,
  .file-cell {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .book-cell .el-image,
  .book-cell .cover-placeholder,
  .file-cell .el-image {
    width: 42px;
    height: 58px;
    border-radius: 6px;
  }
  .cover-placeholder {
    display: grid;
    place-items: center;
    background: var(--el-fill-color);
    font-size: 10px;
  }
  .book-cell strong,
  .book-cell small,
  .file-cell strong,
  .file-cell small {
    display: block;
  }
  .book-cell small,
  .file-cell small,
  .secondary {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;
  }
  .wide {
    grid-column: 1/-1;
  }
  .locale-options {
    justify-content: space-between;
    margin: 12px 0;
  }
  .locale-options > .el-select {
    width: 220px;
  }
  :deep(.el-select) {
    width: 100%;
  }
  :deep(.el-tabs__content) {
    overflow: visible;
  }
  @media (max-width: 720px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .wide {
      grid-column: auto;
    }
    .content-page {
      padding: 12px;
    }
  }
</style>
