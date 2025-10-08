import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { LocaleReader } from './locale-reader'

describe('LocaleReader', () => {
  const localeReader = new LocaleReader()
  const localeDir = path.resolve(__dirname, '../../test/fixtures/public/locale')
  const languages = ['zh-CN', 'en-US']
  const namespaces = ['console']

  it('应该正确读取 locale 文件', () => {
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    expect(localeKeys.size).toBe(2)
    expect(localeKeys.has('zh-CN')).toBe(true)
    expect(localeKeys.has('en-US')).toBe(true)
  })

  it('读取的 keys 应该包含所有翻译', () => {
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    const zhKeys = localeKeys.get('zh-CN')
    expect(zhKeys).toBeDefined()
    expect(zhKeys!.has('common.save')).toBe(true)
    expect(zhKeys!.has('common.cancel')).toBe(true)
    expect(zhKeys!.has('auth.login')).toBe(true)
    expect(zhKeys!.has('messages.welcome')).toBe(true)
    expect(zhKeys!.has('unused.key')).toBe(true)

    const enKeys = localeKeys.get('en-US')
    expect(enKeys).toBeDefined()
    expect(enKeys!.has('common.save')).toBe(true)
    expect(enKeys!.has('auth.login')).toBe(true)
  })

  it('应该处理不存在的 locale 文件', () => {
    const localeKeys = localeReader.read(localeDir, ['non-existent'], namespaces)

    const keys = localeKeys.get('non-existent')
    expect(keys).toBeDefined()
    expect(keys!.size).toBe(0)
  })

  it('应该处理损坏的 JSON 文件', () => {
    // 应该不抛出错误，而是记录错误并继续
    expect(() => {
      localeReader.read(localeDir, ['broken'], ['invalid'])
    }).not.toThrow()

    const localeKeys = localeReader.read(localeDir, ['broken'], ['invalid'])
    const keys = localeKeys.get('broken')

    // 损坏的文件应该返回空集合
    expect(keys).toBeDefined()
    expect(keys!.size).toBe(0)
  })

  it('应该处理空的 JSON 文件', () => {
    const localeKeys = localeReader.read(localeDir, ['empty'], ['test'])

    const keys = localeKeys.get('empty')
    expect(keys).toBeDefined()
    expect(keys!.size).toBe(0)
  })

  it('应该处理深度嵌套的 JSON 对象', () => {
    const localeKeys = localeReader.read(localeDir, ['deep'], ['nested'])

    const keys = localeKeys.get('deep')
    expect(keys).toBeDefined()
    expect(keys!.has('level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.deepKey')).toBe(true)
  })

  it('应该合并多个 namespace 的 keys', () => {
    // 如果有多个 namespace，应该合并所有的 keys
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    for (const [, keys] of localeKeys) {
      // 每种语言的 keys 应该包含所有 namespace 的内容
      expect(keys.size).toBeGreaterThan(0)
    }
  })

  it('应该为每种语言创建独立的 key 集合', () => {
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    const zhKeys = localeKeys.get('zh-CN')
    const enKeys = localeKeys.get('en-US')

    // 修改一个不应该影响另一个
    expect(zhKeys).not.toBe(enKeys)
  })
})
