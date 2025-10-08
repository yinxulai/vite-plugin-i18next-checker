import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { KeyComparator } from './key-comparator'
import { KeyExtractor } from './key-extractor'
import { LocaleReader } from './locale-reader'

describe('KeyComparator', () => {
  const keyComparator = new KeyComparator()
  const keyExtractor = new KeyExtractor()
  const localeReader = new LocaleReader()
  
  const fixturesPath = path.resolve(__dirname, '../../test/fixtures/source')
  const localeDir = path.resolve(__dirname, '../../test/fixtures/public/locale')
  const languages = ['zh-CN', 'en-US']
  const namespaces = ['console']

  it('应该检测缺失的翻译 keys', () => {
    const usedKeys = keyExtractor.extract(fixturesPath)
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    const result = keyComparator.compare(usedKeys, localeKeys, { checkUnused: true })

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.size).toBeGreaterThan(0)

    // 应该检测到 missing.key
    for (const [, missing] of result.missingKeys) {
      expect(missing).toContain('missing.key')
    }
  })

  it('应该检测未使用的翻译 keys', () => {
    const usedKeys = keyExtractor.extract(fixturesPath)
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    const result = keyComparator.compare(usedKeys, localeKeys, { checkUnused: true })

    expect(result.unusedKeys.size).toBeGreaterThan(0)

    // 应该检测到 unused.key
    for (const [, unused] of result.unusedKeys) {
      expect(unused).toContain('unused.key')
    }
  })

  it('当 checkUnused 为 false 时不应检查未使用的 keys', () => {
    const usedKeys = keyExtractor.extract(fixturesPath)
    const localeKeys = localeReader.read(localeDir, languages, namespaces)

    const result = keyComparator.compare(usedKeys, localeKeys, { checkUnused: false })

    expect(result.unusedKeys.size).toBe(0)
  })

  it('当所有 keys 都匹配时应该报告成功', () => {
    const usedKeys = [
      { key: 'common.save', file: 'test.ts', line: 1 },
      { key: 'common.cancel', file: 'test.ts', line: 2 },
    ]

    const localeKeys = new Map([
      ['zh-CN', new Set(['common.save', 'common.cancel'])],
      ['en-US', new Set(['common.save', 'common.cancel'])],
    ])

    const result = keyComparator.compare(usedKeys, localeKeys, { checkUnused: false })

    expect(result.hasErrors).toBe(false)
    expect(result.missingKeys.size).toBe(0)
    expect(result.usedKeys.size).toBe(2)
  })

  it('应该检测多语言之间的不一致', () => {
    const usedKeys = [
      { key: 'common.save', file: 'test.ts', line: 1 },
      { key: 'common.cancel', file: 'test.ts', line: 2 },
    ]

    const localeKeys = new Map([
      ['zh-CN', new Set(['common.save'])],
      ['en-US', new Set(['common.cancel'])],
    ])

    const result = keyComparator.compare(usedKeys, localeKeys, { checkUnused: false })

    expect(result.hasErrors).toBe(true)
    expect(result.missingKeys.get('zh-CN')).toContain('common.cancel')
    expect(result.missingKeys.get('en-US')).toContain('common.save')
  })

  it('应该正确返回检查结果的所有字段', () => {
    const usedKeys = [{ key: 'used.key', file: 'test.ts', line: 1 }]
    const localeKeys = new Map([['zh-CN', new Set(['used.key', 'unused.key'])]])

    const result = keyComparator.compare(usedKeys, localeKeys, { checkUnused: true })

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
})
