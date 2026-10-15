<template>
  <div class="wellness-page art-full-height">
    <div class="wellness-heading">
      <div>
        <p class="eyebrow">DEVICE FLEET</p>
        <h1>{{ t('devices.title') }}</h1>
        <p>{{ t('devices.subtitle') }}</p>
      </div>
    </div>

    <StatCards :items="statCards" />

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :default-expanded="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="wellness-card art-table-card table-card-with-search" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="refreshData" />

      <ArtTable
        :loading="loading"
        :data="data"
        :pagination="pagination"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <ElTableColumn :label="t('devices.serialNumber')" min-width="210">
          <template #default="{ row }">
            <div class="device-identity">
              <strong>{{ row.serialNumber }}</strong>
              <small>{{ row.id }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.model')" min-width="190">
          <template #default="{ row }">
            <div class="device-identity">
              <strong>{{ row.modelName }}</strong>
              <small>{{ row.manufacturer }} · {{ row.modelCode }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.boundUser')" min-width="210">
          <template #default="{ row }">
            <div v-if="row.boundUser" class="user-cell">
              <strong>
                {{ row.boundUser.name }}
                <ElTag v-if="row.isPrimary" size="small" type="warning" effect="plain">
                  {{ t('devices.primary') }}
                </ElTag>
              </strong>
              <small>{{ row.boundUser.email || row.boundUser.id }}</small>
            </div>
            <ElTag v-else type="info" effect="plain">{{ t('devices.unbound') }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.deviceStatus')" width="115">
          <template #default="{ row }">
            <ElTag :type="deviceStatusType(row.status)">
              {{ t(`devices.status.${row.status}`) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.connectionStatus')" width="150">
          <template #default="{ row }">
            <ElTag :type="connectionStatusType(row.connectionStatus)" effect="light">
              {{ t(`devices.connection.${row.connectionStatus}`) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.version')" min-width="145">
          <template #default="{ row }">
            <div class="version-cell">
              <span>FW {{ row.firmwareVersion || '—' }}</span>
              <small>HW {{ row.hardwareRevision || '—' }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.lastSeenAt')" width="180">
          <template #default="{ row }">{{ optionalDateTime(row.lastSeenAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('devices.createdAt')" width="180">
          <template #default="{ row }">{{ optionalDateTime(row.createdAt) }}</template>
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

    <ElDrawer v-model="drawerVisible" :title="t('devices.detailTitle')" size="720px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem :label="t('devices.serialNumber')">
              {{ detail.summary.serialNumber }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.deviceId')">
              {{ detail.summary.id }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.model')">
              {{ detail.summary.manufacturer }} / {{ detail.summary.modelName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.modelCode')">
              {{ detail.summary.modelCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.deviceStatus')">
              <ElTag :type="deviceStatusType(detail.summary.status)">
                {{ t(`devices.status.${detail.summary.status}`) }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.connectionStatus')">
              <ElTag :type="connectionStatusType(detail.summary.connectionStatus)">
                {{ t(`devices.connection.${detail.summary.connectionStatus}`) }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.firmwareVersion')">
              {{ detail.summary.firmwareVersion || '—' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.hardwareRevision')">
              {{ detail.summary.hardwareRevision || '—' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.activatedAt')">
              {{ optionalDateTime(detail.summary.activatedAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="t('devices.lastSeenAt')">
              {{ optionalDateTime(detail.summary.lastSeenAt) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <section class="detail-section">
            <h3>{{ t('devices.currentBinding') }}</h3>
            <ElDescriptions v-if="detail.summary.boundUser" :column="2" border>
              <ElDescriptionsItem :label="t('devices.boundUser')">
                {{ detail.summary.boundUser.name }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :label="t('devices.userIdentity')">
                {{ detail.summary.boundUser.email || detail.summary.boundUser.id }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :label="t('devices.displayName')">
                {{ detail.summary.displayName || '—' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :label="t('devices.wristSide')">
                {{ t(`devices.wrist.${detail.summary.wristSide || 'unspecified'}`) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :label="t('devices.boundAt')">
                {{ optionalDateTime(detail.summary.boundAt) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :label="t('devices.lastSyncedAt')">
                {{ optionalDateTime(detail.summary.lastSyncedAt) }}
              </ElDescriptionsItem>
            </ElDescriptions>
            <ElEmpty v-else :description="t('devices.noCurrentBinding')" :image-size="72" />
          </section>

          <section v-if="capabilityLabels.length" class="detail-section">
            <h3>{{ t('devices.capabilities') }}</h3>
            <div class="capability-list">
              <ElTag v-for="capability in capabilityLabels" :key="capability" effect="plain">
                {{ capability }}
              </ElTag>
            </div>
          </section>

          <section class="detail-section">
            <h3>{{ t('devices.bindingHistory') }}</h3>
            <ElTable v-if="detail.bindingEvents.length" :data="detail.bindingEvents" size="small">
              <ElTableColumn :label="t('devices.eventType')" width="110">
                <template #default="{ row }">
                  <ElTag :type="eventType(row.eventType)" effect="plain">
                    {{ eventLabel(row.eventType) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn :label="t('devices.eventUser')" min-width="190">
                <template #default="{ row }">
                  {{ row.user?.name || row.user?.id || '—' }}
                </template>
              </ElTableColumn>
              <ElTableColumn :label="t('devices.eventSource')" width="110">
                <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('devices.reason')" min-width="140">
                <template #default="{ row }">{{ reasonLabel(row.reasonCode) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('wellness.common.time')" width="180">
                <template #default="{ row }">{{ optionalDateTime(row.occurredAt) }}</template>
              </ElTableColumn>
            </ElTable>
            <ElEmpty v-else :description="t('devices.noBindingHistory')" :image-size="72" />
          </section>
        </template>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchDeviceDetail,
    fetchDeviceRecords,
    type DeviceDetail,
    type DeviceListParams,
    type DeviceStats
  } from '@/api/device'
  import StatCards from '../components/StatCards.vue'
  import { formatDateTime } from '../shared'

  defineOptions({ name: 'DeviceManagement' })

  const { t, locale } = useI18n()
  const statuses = ['inactive', 'active', 'suspended', 'retired']
  const connectionStatuses = ['online', 'offline', 'unknown']
  const bindingStatuses = ['bound', 'unbound']
  const drawerVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<DeviceDetail>()
  const stats = ref<DeviceStats>({
    totalDevices: 0,
    boundDevices: 0,
    onlineDevices: 0,
    modelCount: 0
  })
  const searchForm = ref({
    keyword: '',
    dates: [] as string[],
    status: '',
    connectionStatus: '',
    bindingStatus: '',
    manufacturer: ''
  })

  const searchItems = computed(() => [
    {
      label: t('devices.keyword'),
      key: 'keyword',
      type: 'input',
      props: { clearable: true, placeholder: t('devices.keywordPlaceholder') }
    },
    {
      label: t('devices.createdDate'),
      key: 'dates',
      type: 'daterange',
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: t('wellness.common.startDate'),
        endPlaceholder: t('wellness.common.endDate')
      }
    },
    {
      label: t('devices.deviceStatus'),
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        options: statuses.map((value) => ({ label: t(`devices.status.${value}`), value }))
      }
    },
    {
      label: t('devices.connectionStatus'),
      key: 'connectionStatus',
      type: 'select',
      props: {
        clearable: true,
        options: connectionStatuses.map((value) => ({
          label: t(`devices.connection.${value}`),
          value
        }))
      }
    },
    {
      label: t('devices.bindingStatus'),
      key: 'bindingStatus',
      type: 'select',
      props: {
        clearable: true,
        options: bindingStatuses.map((value) => ({
          label: t(`devices.binding.${value}`),
          value
        }))
      }
    },
    {
      label: t('devices.manufacturer'),
      key: 'manufacturer',
      type: 'input',
      props: { clearable: true, placeholder: t('devices.manufacturerPlaceholder') }
    }
  ])

  const statCards = computed(() => [
    { label: t('devices.totalDevices'), value: stats.value.totalDevices },
    { label: t('devices.boundDevices'), value: stats.value.boundDevices },
    { label: t('devices.onlineDevices'), value: stats.value.onlineDevices },
    { label: t('devices.modelCount'), value: stats.value.modelCount }
  ])

  const fetchTableData = async (params: DeviceListParams) => {
    const response = await fetchDeviceRecords(params)
    stats.value = response.stats
    return response
  }

  const {
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    refreshData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchTableData,
      apiParams: { page: 1, pageSize: 20 },
      paginationKey: { current: 'page', size: 'pageSize' }
    }
  })

  const handleSearch = (params: Record<string, any>) => {
    const { dates, ...filters } = params
    replaceSearchParams({
      ...filters,
      startDate: dates?.[0],
      endDate: dates?.[1]
    })
    getData()
  }
  const handleReset = () => resetSearchParams()

  const openDetail = async (id: string) => {
    drawerVisible.value = true
    detailLoading.value = true
    detail.value = undefined
    try {
      detail.value = await fetchDeviceDetail(id)
    } finally {
      detailLoading.value = false
    }
  }

  const optionalDateTime = (value?: string) => (value ? formatDateTime(value, locale.value) : '—')
  const deviceStatusType = (status: string) =>
    status === 'active' ? 'success' : status === 'suspended' ? 'danger' : 'info'
  const connectionStatusType = (status: string) =>
    status === 'online' ? 'success' : status === 'offline' ? 'info' : 'warning'
  const eventType = (type: string) =>
    type === 'bind' ? 'success' : type === 'unbind' ? 'danger' : 'warning'
  const eventLabel = (type: string) => {
    const key = `devices.events.${type}`
    const label = t(key)
    return label === key ? type : label
  }
  const sourceLabel = (source: string) => {
    const key = `devices.sources.${source}`
    const label = t(key)
    return label === key ? source : label
  }
  const reasonLabel = (reason?: string) => {
    if (!reason) return '—'
    const key = `devices.reasons.${reason}`
    const label = t(key)
    return label === key ? reason : label
  }
  const capabilityLabels = computed(() => {
    const capabilities = detail.value?.summary.capabilities
    if (Array.isArray(capabilities)) return capabilities.map(String)
    if (capabilities && typeof capabilities === 'object') {
      return Object.entries(capabilities)
        .filter(([, enabled]) => enabled !== false && enabled != null)
        .map(([name]) => name)
    }
    return []
  })
</script>

<style scoped lang="scss">
  @use '../shared';

  .table-card-with-search {
    margin-top: 12px;
  }

  .device-identity,
  .version-cell {
    strong,
    span,
    small {
      display: block;
    }

    small {
      margin-top: 3px;
      color: var(--el-text-color-secondary);
    }
  }

  .device-identity small {
    font-family: monospace;
  }

  .capability-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
