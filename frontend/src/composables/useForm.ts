import { reactive } from 'vue'

export interface FormRule {
  required?: boolean
  message?: string
  validator?: (value: any) => boolean | string
  trigger?: 'blur' | 'change'
}

export type FormRules<T> = {
  [K in keyof T]?: FormRule[]
}

/**
 * 表单管理
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  rules?: FormRules<T>
) {
  const form = reactive<T>({ ...initialValues })
  const errors = reactive<Record<string, string>>({})
  const touched = reactive<Record<string, boolean>>({})

  const validateField = (field: keyof T): boolean => {
    if (!rules || !rules[field]) return true
    
    const value = form[field as string]
    const fieldRules = rules[field]!
    
    for (const rule of fieldRules) {
      // 必填验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[field as string] = rule.message || '此字段为必填项'
        return false
      }
      
      // 自定义验证
      if (rule.validator && value !== undefined && value !== null && value !== '') {
        const result = rule.validator(value)
        if (result !== true) {
          errors[field as string] = typeof result === 'string' ? result : (rule.message || '验证失败')
          return false
        }
      }
    }
    
    delete errors[field as string]
    return true
  }

  const validate = (): boolean => {
    if (!rules) return true
    
    let isValid = true
    for (const field of Object.keys(rules)) {
      if (!validateField(field as keyof T)) {
        isValid = false
      }
    }
    return isValid
  }

  const touchField = (field: keyof T) => {
    touched[field as string] = true
    validateField(field)
  }

  const reset = () => {
    Object.assign(form, initialValues)
    Object.keys(errors).forEach(key => delete errors[key])
    Object.keys(touched).forEach(key => delete touched[key])
  }

  const setField = (field: keyof T, value: any) => {
    form[field as string] = value
    if (touched[field as string]) {
      validateField(field)
    }
  }

  return {
    form,
    errors,
    touched,
    validate,
    validateField,
    touchField,
    reset,
    setField
  }
}
