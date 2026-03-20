import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'
import { HTTP_STATUS, STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils'
import router from '@/router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://106.15.91.86:3001/api'

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  silent?: boolean // 是否静默（不显示错误提示）
}

class HttpService {
  private instance: AxiosInstance
  private pendingRequests: Map<string, AbortController>

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.pendingRequests = new Map()
    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证头
        const token = storage.get<string>(STORAGE_KEYS.TOKEN, null)
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`)
        }

        // 添加请求唯一标识（用于取消重复请求）
        const requestKey = this.getRequestKey(config)
        if (this.pendingRequests.has(requestKey)) {
          this.pendingRequests.get(requestKey)?.abort()
        }
        
        const controller = new AbortController()
        config.signal = controller.signal
        this.pendingRequests.set(requestKey, controller)

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 移除 pending 请求
        const requestKey = this.getRequestKey(response.config)
        this.pendingRequests.delete(requestKey)

        // 处理后端返回格式
        if (response.data && typeof response.data === 'object') {
          if ('success' in response.data && !response.data.success) {
            return Promise.reject(new Error(response.data.message || '请求失败'))
          }
          if ('data' in response.data) {
            return response.data.data
          }
        }
        return response.data
      },
      (error: AxiosError) => {
        // 移除 pending 请求
        if (error.config) {
          const requestKey = this.getRequestKey(error.config)
          this.pendingRequests.delete(requestKey)
        }

        return this.handleError(error)
      }
    )
  }

  private getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`
  }

  private handleError(error: AxiosError): Promise<never> {
    const config = error.config as RequestConfig | undefined
    
    // 用户取消请求
    if (error.name === 'AbortError' || error.message === 'canceled') {
      return Promise.reject(new Error('请求已取消'))
    }

    // 网络错误
    if (!error.response) {
      if (!config?.silent) {
        message.error('网络错误，请检查您的网络连接')
      }
      return Promise.reject(new Error('网络错误'))
    }

    const { status, data } = error.response
    let errorMessage = '请求失败'

    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        errorMessage = '登录已过期，请重新登录'
        this.handleUnauthorized()
        break
      case HTTP_STATUS.FORBIDDEN:
        errorMessage = '您没有权限执行此操作'
        break
      case HTTP_STATUS.NOT_FOUND:
        errorMessage = '请求的资源不存在'
        break
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        errorMessage = '请求过于频繁，请稍后再试'
        break
      case HTTP_STATUS.BAD_REQUEST:
        errorMessage = (data as any)?.message || '请求参数错误'
        break
      case HTTP_STATUS.INTERNAL_ERROR:
        errorMessage = '服务器内部错误，请稍后再试'
        break
      default:
        errorMessage = (data as any)?.message || `请求失败 (${status})`
    }

    if (!config?.silent) {
      message.error(errorMessage)
    }

    return Promise.reject(new Error(errorMessage))
  }

  private handleUnauthorized() {
    storage.remove(STORAGE_KEYS.TOKEN)
    storage.remove(STORAGE_KEYS.USER_ROLE)
    router.push('/login')
  }

  // HTTP 方法封装
  public get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  public patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }

  public delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }

  // 取消所有 pending 请求
  public cancelAllRequests() {
    this.pendingRequests.forEach((controller) => {
      controller.abort()
    })
    this.pendingRequests.clear()
  }
}

export const http = new HttpService()
export default http
