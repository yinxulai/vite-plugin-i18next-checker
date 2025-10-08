import { describe, it, expect } from 'vitest'
import { flattenObject } from './object-utils'
import type { LocaleData } from '../types'

describe('flattenObject', () => {
  it('应该正确扁平化嵌套对象', () => {
    const obj: LocaleData = {
      common: {
        save: '保存',
        cancel: '取消',
      },
      auth: {
        login: '登录',
      },
    }

    const result = flattenObject(obj)

    expect(result.has('common.save')).toBe(true)
    expect(result.has('common.cancel')).toBe(true)
    expect(result.has('auth.login')).toBe(true)
    expect(result.size).toBe(3)
  })

  it('应该处理深层嵌套对象', () => {
    const obj: LocaleData = {
      level1: {
        level2: {
          level3: {
            key: 'value',
          },
        },
      },
    }

    const result = flattenObject(obj)

    expect(result.has('level1.level2.level3.key')).toBe(true)
    expect(result.size).toBe(1)
  })

  it('应该处理空对象', () => {
    const obj: LocaleData = {}
    const result = flattenObject(obj)

    expect(result.size).toBe(0)
  })

  it('应该使用前缀', () => {
    const obj: LocaleData = {
      key: 'value',
    }

    const result = flattenObject(obj, 'prefix')

    expect(result.has('prefix.key')).toBe(true)
  })

  it('应该处理包含数组的对象', () => {
    const obj: LocaleData = {
      items: ['item1', 'item2'],
      nested: {
        arr: [1, 2, 3],
      },
    }

    const result = flattenObject(obj)

    // 数组应该被视为值，不应该被扁平化
    expect(result.has('items')).toBe(true)
    expect(result.has('nested.arr')).toBe(true)
    expect(result.size).toBe(2)
  })

  it('应该处理包含 null 值的对象', () => {
    const obj: LocaleData = {
      nullValue: null,
      nested: {
        alsoNull: null,
      },
    }

    const result = flattenObject(obj)

    expect(result.has('nullValue')).toBe(true)
    expect(result.has('nested.alsoNull')).toBe(true)
    expect(result.size).toBe(2)
  })

  it('应该处理包含 undefined 值的对象', () => {
    const obj: LocaleData = {
      undefinedValue: undefined,
      nested: {
        key: 'value',
      },
    }

    const result = flattenObject(obj)

    expect(result.has('undefinedValue')).toBe(true)
    expect(result.has('nested.key')).toBe(true)
    expect(result.size).toBe(2)
  })

  it('应该处理特殊字符的键名', () => {
    const obj: LocaleData = {
      'key-with-dash': 'value',
      'key_with_underscore': 'value',
      'key.with.dot': 'value',
      'key@special#chars': 'value',
    }

    const result = flattenObject(obj)

    expect(result.has('key-with-dash')).toBe(true)
    expect(result.has('key_with_underscore')).toBe(true)
    expect(result.has('key.with.dot')).toBe(true)
    expect(result.has('key@special#chars')).toBe(true)
    expect(result.size).toBe(4)
  })

  it('应该处理数字类型的值', () => {
    const obj: LocaleData = {
      count: 42,
      nested: {
        amount: 100,
      },
    }

    const result = flattenObject(obj)

    expect(result.has('count')).toBe(true)
    expect(result.has('nested.amount')).toBe(true)
    expect(result.size).toBe(2)
  })

  it('应该处理布尔值', () => {
    const obj: LocaleData = {
      isActive: true,
      isEnabled: false,
      nested: {
        flag: true,
      },
    }

    const result = flattenObject(obj)

    expect(result.has('isActive')).toBe(true)
    expect(result.has('isEnabled')).toBe(true)
    expect(result.has('nested.flag')).toBe(true)
    expect(result.size).toBe(3)
  })
})
