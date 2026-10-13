<template>
  <div class="profile-page">
    <ElCard shadow="never" class="profile-card">
      <div class="avatar">{{ initials }}</div>
      <div class="profile-copy">
        <p class="eyebrow">BYND CMS</p>
        <h1>{{ userInfo.userName }}</h1>
        <p>{{ userInfo.email }}</p>
        <div class="roles">
          <ElTag v-for="role in userInfo.roles || []" :key="role" effect="plain">{{ role }}</ElTag>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  defineOptions({ name: 'UserCenter' })
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)
  const initials = computed(() => (userInfo.value.userName || 'BYND').slice(0, 2).toUpperCase())
</script>

<style scoped lang="scss">
  .profile-page {
    max-width: 760px;
    margin: 24px auto;
  }
  .profile-card {
    border-radius: 18px;
  }
  .profile-card :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 32px;
  }
  .avatar {
    display: flex;
    width: 76px;
    height: 76px;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: white;
    font-size: 22px;
    font-weight: 700;
    background: var(--el-color-primary);
    border-radius: 50%;
  }
  .profile-copy {
    min-width: 0;
  }
  .eyebrow {
    margin: 0 0 6px;
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  h1 {
    margin: 0;
    overflow: hidden;
    font-size: 28px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .profile-copy > p:not(.eyebrow) {
    margin: 8px 0 0;
    color: var(--el-text-color-secondary);
    overflow-wrap: anywhere;
  }
  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }
  @media (max-width: 520px) {
    .profile-card :deep(.el-card__body) {
      align-items: flex-start;
      flex-direction: column;
      padding: 24px;
    }
  }
</style>
