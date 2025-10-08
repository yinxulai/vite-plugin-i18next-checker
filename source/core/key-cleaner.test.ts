import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { KeyCleaner } from './key-cleaner'

describe('KeyCleaner', () => {
  const keyCleaner = new KeyCleaner()
  const testDir = path.join(__dirname, '../../test/temp-test-locale')
  
  beforeEach(() => {
    // 创建临时测试目录
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    // 清理临时测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('应该正确删除未使用的 keys', () => {
    // 创建测试语言目录和文件
    const langDir = path.join(testDir, 'zh-CN')
    fs.mkdirSync(langDir, { recursive: true })
    
    const testFile = path.join(langDir, 'test.json')
    const testData = {
      used: {
        key1: 'value1',
        key2: 'value2',
      },
      unused: {
        key3: 'value3',
        key4: 'value4',
      },
    }
    
    fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), 'utf-8')
    
    // 定义使用的 keys
    const usedKeys = new Set(['used.key1', 'used.key2'])
    
    // 执行清理
    const removed = keyCleaner.clean(testDir, ['zh-CN'], ['test'], usedKeys)
    
    // 验证删除的数量
    expect(removed).toBe(2)
    
    // 验证文件内容
    const updatedContent = JSON.parse(fs.readFileSync(testFile, 'utf-8'))
    expect(updatedContent).toHaveProperty('used')
    expect(updatedContent.used).toHaveProperty('key1')
    expect(updatedContent.used).toHaveProperty('key2')
    expect(updatedContent).not.toHaveProperty('unused')
  })

  it('应该处理嵌套的未使用 keys', () => {
    const langDir = path.join(testDir, 'en-US')
    fs.mkdirSync(langDir, { recursive: true })
    
    const testFile = path.join(langDir, 'nested.json')
    const testData = {
      level1: {
        used: 'value1',
        level2: {
          used: 'value2',
          unused: 'value3',
        },
        unused: 'value4',
      },
    }
    
    fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), 'utf-8')
    
    const usedKeys = new Set(['level1.used', 'level1.level2.used'])
    
    const removed = keyCleaner.clean(testDir, ['en-US'], ['nested'], usedKeys)
    
    expect(removed).toBe(2)
    
    const updatedContent = JSON.parse(fs.readFileSync(testFile, 'utf-8'))
    expect(updatedContent.level1.used).toBe('value1')
    expect(updatedContent.level1.level2.used).toBe('value2')
    expect(updatedContent.level1).not.toHaveProperty('unused')
    expect(updatedContent.level1.level2).not.toHaveProperty('unused')
  })

  it('应该保留所有使用的 keys', () => {
    const langDir = path.join(testDir, 'zh-CN')
    fs.mkdirSync(langDir, { recursive: true })
    
    const testFile = path.join(langDir, 'all-used.json')
    const testData = {
      key1: 'value1',
      key2: 'value2',
      nested: {
        key3: 'value3',
      },
    }
    
    fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), 'utf-8')
    
    const usedKeys = new Set(['key1', 'key2', 'nested.key3'])
    
    const removed = keyCleaner.clean(testDir, ['zh-CN'], ['all-used'], usedKeys)
    
    expect(removed).toBe(0)
    
    const updatedContent = JSON.parse(fs.readFileSync(testFile, 'utf-8'))
    expect(updatedContent).toEqual(testData)
  })

  it('应该处理多个语言的文件', () => {
    // 创建多个语言目录
    const zhDir = path.join(testDir, 'zh-CN')
    const enDir = path.join(testDir, 'en-US')
    fs.mkdirSync(zhDir, { recursive: true })
    fs.mkdirSync(enDir, { recursive: true })
    
    const testData = {
      used: 'used value',
      unused: 'unused value',
    }
    
    fs.writeFileSync(path.join(zhDir, 'common.json'), JSON.stringify(testData, null, 2), 'utf-8')
    fs.writeFileSync(path.join(enDir, 'common.json'), JSON.stringify(testData, null, 2), 'utf-8')
    
    const usedKeys = new Set(['used'])
    
    const removed = keyCleaner.clean(testDir, ['zh-CN', 'en-US'], ['common'], usedKeys)
    
    // 应该从两个文件中各删除一个 key
    expect(removed).toBe(2)
    
    const zhContent = JSON.parse(fs.readFileSync(path.join(zhDir, 'common.json'), 'utf-8'))
    const enContent = JSON.parse(fs.readFileSync(path.join(enDir, 'common.json'), 'utf-8'))
    
    expect(zhContent).toEqual({ used: 'used value' })
    expect(enContent).toEqual({ used: 'used value' })
  })

  it('应该处理不存在的文件', () => {
    const usedKeys = new Set(['key1'])
    
    // 不应该抛出错误
    expect(() => {
      keyCleaner.clean(testDir, ['non-existent'], ['test'], usedKeys)
    }).not.toThrow()
  })

  it('应该处理空的 locale 文件', () => {
    const langDir = path.join(testDir, 'zh-CN')
    fs.mkdirSync(langDir, { recursive: true })
    
    const testFile = path.join(langDir, 'empty.json')
    fs.writeFileSync(testFile, JSON.stringify({}, null, 2), 'utf-8')
    
    const usedKeys = new Set(['key1'])
    
    const removed = keyCleaner.clean(testDir, ['zh-CN'], ['empty'], usedKeys)
    
    expect(removed).toBe(0)
  })
})
