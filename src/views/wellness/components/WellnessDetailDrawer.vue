<template>
  <ElDrawer v-model="visible" :title="title" size="min(760px, 100vw)">
    <div v-loading="loading" class="detail-content" :aria-busy="loading">
      <ElAlert
        v-if="error"
        :title="t('wellness.experience.loadError')"
        type="error"
        :closable="false"
      />
      <ElButton v-if="error" class="retry-button" @click="$emit('retry')">{{
        t('wellness.experience.retry')
      }}</ElButton>
      <slot v-if="!loading && !error" />
    </div>
  </ElDrawer>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  defineProps<{ title: string; loading: boolean; error: boolean }>()
  defineEmits<{ retry: [] }>()
  const visible = defineModel<boolean>({ required: true })
  const { t } = useI18n()
</script>
<style scoped>
  .detail-content {
    min-height: 120px;
  }
  .retry-button {
    margin-top: 12px;
  }
</style>
