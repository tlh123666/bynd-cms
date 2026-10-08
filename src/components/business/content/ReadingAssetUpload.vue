<template>
  <div class="asset-upload">
    <ElUpload :accept="accept" :show-file-list="false" :http-request="upload">
      <ElButton :loading="loading" :type="buttonType"
        ><ArtSvgIcon icon="ri:upload-cloud-2-line" />{{ label }}</ElButton
      >
    </ElUpload>
    <span v-if="modelValue" class="asset-name">{{ modelValue.originalFilename }}</span>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import type { UploadRequestOptions } from 'element-plus'
  import { uploadReadingAsset, type ReadingAsset } from '@/api/content'
  const props = defineProps<{
    kind: 'cover' | 'epub'
    label: string
    modelValue?: ReadingAsset
    buttonType?: 'primary' | 'default'
  }>()
  const emit = defineEmits<{ 'update:modelValue': [ReadingAsset]; uploaded: [ReadingAsset] }>()
  const loading = ref(false)
  const accept =
    props.kind === 'cover' ? 'image/jpeg,image/png,image/webp' : '.epub,application/epub+zip'
  const upload = async (options: UploadRequestOptions) => {
    loading.value = true
    try {
      const asset = await uploadReadingAsset(props.kind, options.file)
      emit('update:modelValue', asset)
      emit('uploaded', asset)
      options.onSuccess(asset)
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }
</script>
<style scoped>
  .asset-upload {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .asset-name {
    max-width: 280px;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el-button :deep(svg) {
    margin-right: 6px;
  }
</style>
