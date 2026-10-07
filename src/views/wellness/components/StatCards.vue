<template>
  <div class="wellness-stats">
    <div v-for="item in items" :key="item.label" class="wellness-stat-card">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ items: Array<{ label: string; value: string | number }> }>()
</script>

<style scoped lang="scss">
  .wellness-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .wellness-stat-card {
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

  @media (width <= 900px) {
    .wellness-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
