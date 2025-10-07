import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { i18nextChecker } from '../src/index';

describe('i18nextChecker Plugin', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('应该创建一个有效的 Vite 插件', () => {
    const plugin = i18nextChecker();
    
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('vite-plugin-i18next-checker');
    expect(plugin.configResolved).toBeDefined();
    expect(plugin.buildStart).toBeDefined();
  });

  it('应该使用默认选项', () => {
    const plugin = i18nextChecker();
    
    expect(plugin.name).toBe('vite-plugin-i18next-checker');
  });

  it('应该接受自定义选项', () => {
    const plugin = i18nextChecker({
      srcDir: 'custom/src',
      localeDir: 'custom/locale',
      languages: ['ja', 'ko'],
      namespaces: ['common', 'admin'],
      failOnError: true,
      checkUnused: false,
    });
    
    expect(plugin.name).toBe('vite-plugin-i18next-checker');
  });

  it('configResolved 应该设置项目根目录', () => {
    const plugin = i18nextChecker();
    const mockConfig = {
      root: '/test/project',
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // 验证没有错误
    expect(true).toBe(true);
  });

  it('buildStart 应该执行检查', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // @ts-ignore
    plugin.buildStart!();
    
    // 验证 console.log 被调用
    expect(consoleLogSpy).toHaveBeenCalled();
    
    // 应该输出检查开始的消息
    const allCalls = consoleLogSpy.mock.calls.flat();
    const hasStartMessage = allCalls.some((call: string) => 
      call.includes('开始检查') || call.includes('i18n')
    );
    expect(hasStartMessage).toBe(true);
  });

  it('buildStart 应该检测缺失的 keys', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // @ts-ignore
    plugin.buildStart!();
    
    // 验证输出包含缺失的 key 信息
    const allCalls = consoleLogSpy.mock.calls.flat();
    const hasMissingKey = allCalls.some((call: string) => 
      typeof call === 'string' && call.includes('missing.key')
    );
    expect(hasMissingKey).toBe(true);
  });

  it('buildStart 应该检测未使用的 keys', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // @ts-ignore
    plugin.buildStart!();
    
    // 验证输出包含未使用的 key 信息
    const allCalls = consoleLogSpy.mock.calls.flat();
    const hasUnusedKey = allCalls.some((call: string) => 
      typeof call === 'string' && call.includes('unused.key')
    );
    expect(hasUnusedKey).toBe(true);
  });

  it('当 failOnError 为 true 时应该抛出错误', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: true,
      checkUnused: true,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // 应该抛出错误
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).toThrow();
  });

  it('当 checkUnused 为 false 时不应检查未使用的 keys', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // @ts-ignore
    plugin.buildStart!();
    
    // 验证输出不包含未使用的 key 信息
    const allCalls = consoleLogSpy.mock.calls.flat();
    const hasUnusedMessage = allCalls.some((call: string) => 
      typeof call === 'string' && call.includes('未使用')
    );
    expect(hasUnusedMessage).toBe(false);
  });

  it('应该处理不存在的源目录', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'non-existent',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // 不应该抛出错误
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
  });

  it('应该处理不存在的 locale 目录', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'non-existent',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // 不应该抛出错误
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
  });

  it('应该支持多个 namespace', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console', 'common', 'admin'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // @ts-ignore
    plugin.buildStart!();
    
    // 验证能够处理多个 namespace
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('应该在 serve 模式下工作', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'serve',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
  });

  it('应该在 build 模式下工作', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
  });

  it('应该正确处理插件钩子调用顺序', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // 先调用 configResolved
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // 再调用 buildStart
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
    
    // 多次调用 buildStart 应该也能工作
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
  });

  it('不调用 configResolved 应该使用当前工作目录', () => {
    const plugin = i18nextChecker({
      srcDir: 'non-existent',
      localeDir: 'non-existent',
      languages: ['zh-CN'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: false,
    });

    // 不调用 configResolved，直接调用 buildStart
    expect(() => {
      // @ts-ignore
      plugin.buildStart!();
    }).not.toThrow();
  });

  it('应该正确返回插件名称', () => {
    const plugin = i18nextChecker();
    expect(plugin.name).toBe('vite-plugin-i18next-checker');
  });

  it('应该在控制台输出彩色信息', () => {
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const plugin = i18nextChecker({
      srcDir: 'source',
      localeDir: 'public/locale',
      languages: ['zh-CN', 'en-US'],
      namespaces: ['console'],
      failOnError: false,
      checkUnused: true,
    });

    const mockConfig = {
      root: fixturesPath,
      command: 'build',
    };
    
    // @ts-ignore
    plugin.configResolved!(mockConfig);
    
    // @ts-ignore
    plugin.buildStart!();
    
    // 验证输出包含特殊字符（emoji 等）
    const allCalls = consoleLogSpy.mock.calls.flat().join('');
    const hasEmoji = /[📍🗑️✅❌⚠️]/.test(allCalls);
    expect(hasEmoji).toBe(true);
  });
});
