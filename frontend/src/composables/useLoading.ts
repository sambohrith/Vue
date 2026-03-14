import { ref } from 'vue'

/**
 * 加载状态管理
 */
export function useLoading() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const startLoading = () => {
    loading.value = true
    error.value = null
  }

  const stopLoading = () => {
    loading.value = false
  }

  const setError = (msg: string) => {
    error.value = msg
    loading.value = false
  }

  const clearError = () => {
    error.value = null
  }

  const run = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    startLoading()
    try {
      const result = await fn()
      return result
    } catch (err: any) {
      setError(err.message || '操作失败')
      throw err
    } finally {
      stopLoading()
    }
  }

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setError,
    clearError,
    run
  }
}
