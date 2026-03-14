import { ref, watch } from 'vue'
import { debounce } from '@/utils'

/**
 * 搜索管理
 */
export function useSearch<T>(
  fetchFn: (keyword: string) => Promise<T[]>,
  options: { debounceMs?: number; immediate?: boolean } = {}
) {
  const { debounceMs = 300, immediate = false } = options
  
  const keyword = ref('')
  const results = ref<T[]>([])
  const loading = ref(false)

  const search = async (val: string) => {
    if (!val.trim()) {
      results.value = []
      return
    }
    
    loading.value = true
    try {
      results.value = await fetchFn(val)
    } finally {
      loading.value = false
    }
  }

  const debouncedSearch = debounce(search, debounceMs)

  watch(keyword, (val) => {
    debouncedSearch(val)
  })

  const clear = () => {
    keyword.value = ''
    results.value = []
  }

  if (immediate) {
    search(keyword.value)
  }

  return {
    keyword,
    results,
    loading,
    search,
    clear
  }
}
