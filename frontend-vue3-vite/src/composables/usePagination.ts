import { ref, computed } from 'vue'

export interface PaginationOptions {
  pageSize?: number
  immediate?: boolean
}

/**
 * 分页管理
 */
export function usePagination<T>(
  fetchFn: (params: { page: number; pageSize: number }) => Promise<{ list: T[]; total: number }>,
  options: PaginationOptions = {}
) {
  const { pageSize = 10 } = options

  const list = ref<T[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)

  const hasMore = computed(() => list.value.length < total.value)

  const fetchList = async (reset = false) => {
    if (loading.value) return
    
    loading.value = true
    try {
      if (reset) page.value = 1
      
      const result = await fetchFn({
        page: page.value,
        pageSize
      })

      if (reset) {
        list.value = result.list as any
      } else {
        list.value.push(...result.list as any)
      }
      total.value = result.total
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || loading.value) return
    page.value++
    await fetchList()
  }

  const refresh = () => fetchList(true)

  return {
    list,
    total,
    page,
    pageSize,
    loading,
    hasMore,
    fetchList,
    loadMore,
    refresh
  }
}
