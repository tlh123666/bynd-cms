import { onScopeDispose, ref, shallowRef, watch } from 'vue'

// Closing or switching records invalidates pending responses. A slower request
// must never replace the currently selected user's health information.
export function useWellnessDetail<T>(fetcher: (id: string) => Promise<T>) {
  const drawerVisible = ref(false)
  const detailLoading = ref(false)
  const detailError = ref(false)
  const detail = shallowRef<T>()
  let sequence = 0
  let selectedId = ''
  watch(
    drawerVisible,
    (visible) => {
      if (!visible) sequence++
    },
    { flush: 'sync' }
  )
  onScopeDispose(() => {
    sequence++
  })
  const openDetail = async (id: string) => {
    selectedId = id
    const request = ++sequence
    drawerVisible.value = true
    detailLoading.value = true
    detailError.value = false
    detail.value = undefined
    try {
      const response = await fetcher(id)
      if (request === sequence) detail.value = response
    } catch {
      if (request === sequence) detailError.value = true
    } finally {
      if (request === sequence) detailLoading.value = false
    }
  }
  return {
    drawerVisible,
    detailLoading,
    detailError,
    detail,
    openDetail,
    retryDetail: () => openDetail(selectedId)
  }
}
