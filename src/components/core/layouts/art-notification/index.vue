<template>
  <div v-if="value" class="art-notification-panel art-card-sm !shadow-xl" @click.stop>
    <div class="header">
      <span>{{ $t('notice.title') }}</span>
      <ElButton text @click="emit('update:value', false)">×</ElButton>
    </div>
    <ElEmpty :description="$t('notice.text[0]')" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtNotification' })
  defineProps<{ value: boolean }>()
  const emit = defineEmits<{ 'update:value': [value: boolean] }>()
</script>

<style scoped lang="scss">
  .art-notification-panel {
    position: absolute;
    top: 60px;
    right: 18px;
    z-index: 1000;
    width: min(360px, calc(100vw - 36px));
    padding: 18px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
  }
</style>
