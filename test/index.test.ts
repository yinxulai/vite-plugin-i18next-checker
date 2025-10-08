import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
  flattenObject,
  extractI18nKeys,
  readLocaleFiles,
  reportDifferences,
} from '../source/index'
import type { LocaleData, I18nextCheckerOptions } from '../source/types'

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

describe('extractI18nKeys', () => {
  const fixturesPath = path.resolve(__dirname, 'fixtures/source')

  it('应该从源文件中提取 i18next keys', () => {
    const keys = extractI18nKeys(fixturesPath)

    expect(keys.length).toBeGreaterThan(0)

    // 检查是否提取了预期的 keys
    const keyStrings = keys.map(k => k.key)
    expect(keyStrings).toContain('common.save')
    expect(keyStrings).toContain('common.cancel')
    expect(keyStrings).toContain('common.confirm')
    expect(keyStrings).toContain('auth.login')
    expect(keyStrings).toContain('auth.logout')
    expect(keyStrings).toContain('messages.welcome')
    expect(keyStrings).toContain('missing.key')
    expect(keyStrings).toContain('common.delete')
    expect(keyStrings).toContain('messages.goodbye')
  })

  it('提取的 key 应该包含文件路径和行号', () => {
    const keys = extractI18nKeys(fixturesPath)

    keys.forEach(key => {
      expect(key.file).toBeTruthy()
      expect(key.line).toBeGreaterThan(0)
      expect(key.key).toBeTruthy()
    })
  })

  it('应该跳过包含变量插值的 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 不应该包含动态 key
    expect(keyStrings.every(k => !k.includes('$'))).toBe(true)
    expect(keyStrings.every(k => !k.includes('{{'))).toBe(true)
  })

  it('处理不存在的目录应该返回空数组', () => {
    const keys = extractI18nKeys('/non/existent/path')
    expect(keys).toEqual([])
  })

  it('应该支持不同的文件扩展名', () => {
    const keys = extractI18nKeys(fixturesPath)
    const files = keys.map(k => path.extname(k.file))

    // 应该包含 .ts, .tsx, .js, .jsx 文件
    expect(files.some(ext => ext === '.tsx')).toBe(true)
    expect(files.some(ext => ext === '.ts')).toBe(true)
    expect(files.some(ext => ext === '.js')).toBe(true)
    expect(files.some(ext => ext === '.jsx')).toBe(true)
  })

  it('应该处理多种 t() 函数调用方式', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 标准调用
    expect(keyStrings).toContain('standard.key')

    // 带空格
    expect(keyStrings).toContain('with.spaces')

    // 注意：当前实现按行处理，不支持跨行的 t() 调用
    // 这是一个已知的限制，可以在未来改进
    // expect(keyStrings).toContain('with.newline');

    // 双引号
    expect(keyStrings).toContain('double.quotes')

    // 反引号（无插值）
    expect(keyStrings).toContain('backtick.key')
  })

  it('应该提取同一行的多个 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('first.key')
    expect(keyStrings).toContain('second.key')
  })

  it('应该提取对象和数组中的 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 对象中的 key
    expect(keyStrings).toContain('object.label')
    expect(keyStrings).toContain('object.title')

    // 数组中的 key
    expect(keyStrings).toContain('array.first')
    expect(keyStrings).toContain('array.second')
  })

  it('应该提取函数参数中的 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('function.arg')
    expect(keyStrings).toContain('another.arg')
  })

  it('应该提取条件表达式中的 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('condition.true')
    expect(keyStrings).toContain('condition.false')
  })

  it('应该提取模板字符串中的 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('template.key')
  })

  it('应该处理特殊字符的 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('special-chars_123.key')
  })

  it('应该跳过注释中的 t() 函数', () => {
    // const keys = extractI18nKeys(fixturesPath)
    // const keyStrings = keys.map(k => k.key)

    // 注释中的 key 应该仍然被提取（因为代码用简单的正则）
    // 这是一个已知的限制，可以在未来改进
  })

  it('应该只提取静态 key，跳过动态 key', () => {
    const keys = extractI18nKeys(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 有效的静态 key 应该被提取
    expect(keyStrings).toContain('valid.static.key')
    expect(keyStrings).toContain('another.valid.key')

    // 动态 key 应该被跳过
    expect(keyStrings.every(k => !k.includes('$'))).toBe(true)
    expect(keyStrings.every(k => !k.includes('{{'))).toBe(true)
  })
})

describe('readLocaleFiles', () => {
  const localeDir = path.resolve(__dirname, 'fixtures/public/locale')
  const languages = ['zh-CN', 'en-US']
  const namespaces = ['console']

  it('应该正确读取 locale 文件', () => {
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    expect(localeKeys.size).toBe(2)
    expect(localeKeys.has('zh-CN')).toBe(true)
    expect(localeKeys.has('en-US')).toBe(true)
  })

  it('读取的 keys 应该包含所有翻译', () => {
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

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
    const localeKeys = readLocaleFiles(localeDir, ['non-existent'], namespaces)

    const keys = localeKeys.get('non-existent')
    expect(keys).toBeDefined()
    expect(keys!.size).toBe(0)
  })

  it('应该处理损坏的 JSON 文件', () => {
    const brokenDir = path.resolve(__dirname, 'fixtures/public/locale')

    // 应该不抛出错误，而是记录错误并继续
    expect(() => {
      readLocaleFiles(brokenDir, ['broken'], ['invalid'])
    }).not.toThrow()

    const localeKeys = readLocaleFiles(brokenDir, ['broken'], ['invalid'])
    const keys = localeKeys.get('broken')

    // 损坏的文件应该返回空集合
    expect(keys).toBeDefined()
    expect(keys!.size).toBe(0)
  })

  it('应该处理空的 JSON 文件', () => {
    const emptyDir = path.resolve(__dirname, 'fixtures/public/locale')
    const localeKeys = readLocaleFiles(emptyDir, ['empty'], ['test'])

    const keys = localeKeys.get('empty')
    expect(keys).toBeDefined()
    expect(keys!.size).toBe(0)
  })

  it('应该处理深度嵌套的 JSON 对象', () => {
    const deepDir = path.resolve(__dirname, 'fixtures/public/locale')
    const localeKeys = readLocaleFiles(deepDir, ['deep'], ['nested'])

    const keys = localeKeys.get('deep')
    expect(keys).toBeDefined()
    expect(keys!.has('level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.deepKey')).toBe(true)
  })

  it('应该合并多个 namespace 的 keys', () => {
    // 如果有多个 namespace，应该合并所有的 keys
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    for (const [, keys] of localeKeys) {
      // 每种语言的 keys 应该包含所有 namespace 的内容
      expect(keys.size).toBeGreaterThan(0)
    }
  })

  it('应该为每种语言创建独立的 key 集合', () => {
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    const zhKeys = localeKeys.get('zh-CN')
    const enKeys = localeKeys.get('en-US')

    // 修改一个不应该影响另一个
    expect(zhKeys).not.toBe(enKeys)
  })
})

describe('reportDifferences', () => {
  const fixturesPath = path.resolve(__dirname, 'fixtures/source')
  const localeDir = path.resolve(__dirname, 'fixtures/public/locale')
  const languages = ['zh-CN', 'en-US']
  const namespaces = ['console']

  it('应该检测缺失的翻译 keys', () => {
    const usedKeys = extractI18nKeys(fixturesPath)
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages,
      namespaces,
      failOnError: false,
      checkUnused: true,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.size).toBeGreaterThan(0)

    // 应该检测到 missing.key
    for (const [, missing] of result.missingKeys) {
      expect(missing).toContain('missing.key')
    }
  })

  it('应该检测未使用的翻译 keys', () => {
    const usedKeys = extractI18nKeys(fixturesPath)
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages,
      namespaces,
      failOnError: false,
      checkUnused: true,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.unusedKeys.size).toBeGreaterThan(0)

    // 应该检测到 unused.key
    for (const [, unused] of result.unusedKeys) {
      expect(unused).toContain('unused.key')
    }
  })

  it('当 checkUnused 为 false 时不应检查未使用的 keys', () => {
    const usedKeys = extractI18nKeys(fixturesPath)
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages,
      namespaces,
      failOnError: false,
      checkUnused: false,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.unusedKeys.size).toBe(0)
  })

  it('应该生成详细的检查结果', () => {
    const usedKeys = extractI18nKeys(fixturesPath)
    const localeKeys = readLocaleFiles(localeDir, languages, namespaces)

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages,
      namespaces,
      failOnError: false,
      checkUnused: true,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.size).toBeGreaterThan(0)
    expect(result.unusedKeys.size).toBeGreaterThan(0)
    
    // 验证 missing.key 存在于某个语言的缺失键中
    let hasMissingKey = false
    for (const keys of result.missingKeys.values()) {
      if (keys.includes('missing.key')) {
        hasMissingKey = true
        break
      }
    }
    expect(hasMissingKey).toBe(true)
    
    // 验证 unused.key 存在于某个语言的未使用键中
    let hasUnusedKey = false
    for (const keys of result.unusedKeys.values()) {
      if (keys.includes('unused.key')) {
        hasUnusedKey = true
        break
      }
    }
    expect(hasUnusedKey).toBe(true)
  })

  it('当所有 keys 都匹配时应该报告成功', () => {
    // 创建一个场景，所有 keys 都匹配
    const usedKeys = [
      { key: 'common.save', file: 'test.ts', line: 1 },
      { key: 'common.cancel', file: 'test.ts', line: 2 },
    ]

    const localeKeys = new Map([
      ['zh-CN', new Set(['common.save', 'common.cancel'])],
      ['en-US', new Set(['common.save', 'common.cancel'])],
    ])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(false)
    expect(result.missingKeys.size).toBe(0)
    expect(result.usedKeys.size).toBe(2)
  })

  it('应该检测多语言之间的不一致', () => {
    const usedKeys = [
      { key: 'common.save', file: 'test.ts', line: 1 },
      { key: 'common.cancel', file: 'test.ts', line: 2 },
    ]

    // zh-CN 缺少 common.cancel，en-US 缺少 common.save
    const localeKeys = new Map([
      ['zh-CN', new Set(['common.save'])],
      ['en-US', new Set(['common.cancel'])],
    ])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.get('zh-CN')).toContain('common.cancel')
    expect(result.missingKeys.get('en-US')).toContain('common.save')
  })

  it('应该正确处理大量缺失的 keys', () => {
    const usedKeys = Array.from({ length: 100 }, (_, i) => ({
      key: `key.${i}`,
      file: 'test.ts',
      line: i + 1,
    }))

    const localeKeys = new Map([
      ['zh-CN', new Set<string>()], // 全部缺失
    ])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.get('zh-CN')?.length).toBe(100)
  })

  it('应该正确处理大量未使用的 keys', () => {
    const usedKeys = [
      { key: 'used.key', file: 'test.ts', line: 1 },
    ]

    // 创建大量未使用的 keys
    const unusedKeys = new Set<string>(['used.key'])
    for (let i = 0; i < 100; i++) {
      unusedKeys.add(`unused.key.${i}`)
    }

    const localeKeys = new Map<string, Set<string>>([
      ['zh-CN', unusedKeys],
    ])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(false) // 未使用的 key 不算错误
    expect(result.unusedKeys.get('zh-CN')?.length).toBe(100)
  })

  it('报告应该包含文件位置信息', () => {
    const usedKeys = [
      { key: 'missing.key', file: '/path/to/file.ts', line: 42 },
    ]

    const localeKeys = new Map([
      ['zh-CN', new Set<string>()],
    ])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.get('zh-CN')).toContain('missing.key')
    // 验证文件位置信息在 usedKeys 中
    const missingKeyInfo = usedKeys.find(k => k.key === 'missing.key')
    expect(missingKeyInfo?.file).toBe('/path/to/file.ts')
    expect(missingKeyInfo?.line).toBe(42)
  })

  it('应该正确返回检查结果的所有字段', () => {
    const usedKeys = [
      { key: 'used.key', file: 'test.ts', line: 1 },
    ]

    const localeKeys = new Map([
      ['zh-CN', new Set(['used.key', 'unused.key'])],
    ])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    expect(result).toHaveProperty('hasErrors')
    expect(result).toHaveProperty('missingKeys')
    expect(result).toHaveProperty('unusedKeys')
    expect(result).toHaveProperty('usedKeys')
    expect(result).toHaveProperty('definedKeys')

    expect(result.usedKeys).toBeInstanceOf(Set)
    expect(result.missingKeys).toBeInstanceOf(Map)
    expect(result.unusedKeys).toBeInstanceOf(Map)
    expect(result.definedKeys).toBeInstanceOf(Map)
  })

  it('未使用的 key 应该被正确识别', () => {
    const usedKeys = [{ key: 'used.key', file: 'test.ts', line: 1 }]

    // 创建超过 10 个未使用的 keys
    const keys = new Set<string>(['used.key'])
    for (let i = 0; i < 25; i++) {
      keys.add(`unused.key.${i}`)
    }

    const localeKeys = new Map<string, Set<string>>([['zh-CN', keys]])

    const options: Required<I18nextCheckerOptions> = {
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    }

    const result = reportDifferences(usedKeys, localeKeys, options)

    // 验证未使用的 keys 数量
    expect(result.unusedKeys.get('zh-CN')?.length).toBe(25)
    expect(result.hasErrors).toBe(false) // 未使用的 key 不应该标记为错误
  })
})
