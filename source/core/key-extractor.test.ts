import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { KeyExtractor } from './key-extractor'

describe('KeyExtractor', () => {
  const keyExtractor = new KeyExtractor()
  const fixturesPath = path.resolve(__dirname, '../../test/fixtures/source')

  it('应该从源文件中提取 i18next keys', () => {
    const keys = keyExtractor.extract(fixturesPath)

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
    const keys = keyExtractor.extract(fixturesPath)

    keys.forEach(key => {
      expect(key.file).toBeTruthy()
      expect(key.line).toBeGreaterThan(0)
      expect(key.key).toBeTruthy()
    })
  })

  it('应该跳过包含变量插值的 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 不应该包含动态 key
    expect(keyStrings.every(k => !k.includes('$'))).toBe(true)
    expect(keyStrings.every(k => !k.includes('{{'))).toBe(true)
  })

  it('处理不存在的目录应该返回空数组', () => {
    const keys = keyExtractor.extract('/non/existent/path')
    expect(keys).toEqual([])
  })

  it('应该支持不同的文件扩展名', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const files = keys.map(k => path.extname(k.file))

    // 应该包含 .ts, .tsx, .js, .jsx 文件
    expect(files.some(ext => ext === '.tsx')).toBe(true)
    expect(files.some(ext => ext === '.ts')).toBe(true)
    expect(files.some(ext => ext === '.js')).toBe(true)
    expect(files.some(ext => ext === '.jsx')).toBe(true)
  })

  it('应该处理多种 t() 函数调用方式', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 标准调用
    expect(keyStrings).toContain('standard.key')

    // 带空格
    expect(keyStrings).toContain('with.spaces')

    // 双引号
    expect(keyStrings).toContain('double.quotes')

    // 反引号（无插值）
    expect(keyStrings).toContain('backtick.key')
  })

  it('应该提取同一行的多个 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('first.key')
    expect(keyStrings).toContain('second.key')
  })

  it('应该提取对象和数组中的 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 对象中的 key
    expect(keyStrings).toContain('object.label')
    expect(keyStrings).toContain('object.title')

    // 数组中的 key
    expect(keyStrings).toContain('array.first')
    expect(keyStrings).toContain('array.second')
  })

  it('应该提取函数参数中的 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('function.arg')
    expect(keyStrings).toContain('another.arg')
  })

  it('应该提取条件表达式中的 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('condition.true')
    expect(keyStrings).toContain('condition.false')
  })

  it('应该提取模板字符串中的 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('template.key')
  })

  it('应该处理特殊字符的 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    expect(keyStrings).toContain('special-chars_123.key')
  })

  it('应该只提取静态 key，跳过动态 key', () => {
    const keys = keyExtractor.extract(fixturesPath)
    const keyStrings = keys.map(k => k.key)

    // 有效的静态 key 应该被提取
    expect(keyStrings).toContain('valid.static.key')
    expect(keyStrings).toContain('another.valid.key')

    // 动态 key 应该被跳过
    expect(keyStrings.every(k => !k.includes('$'))).toBe(true)
    expect(keyStrings.every(k => !k.includes('{{'))).toBe(true)
  })
})
