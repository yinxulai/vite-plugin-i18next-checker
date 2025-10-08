# vite-plugin-i18next-checker

[![CI](https://github.com/yinxulai/vite-plugin-i18next-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/yinxulai/vite-plugin-i18next-checker/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/vite-plugin-i18next-checker.svg)](https://www.npmjs.com/package/vite-plugin-i18next-checker)
[![codecov](https://codecov.io/gh/yinxulai/vite-plugin-i18next-checker/branch/main/graph/badge.svg)](https://codecov.io/gh/yinxulai/vite-plugin-i18next-checker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | 中文

一个用于检查 i18next 翻译键一致性的 Vite 插件。它可以帮助你在构建过程中发现缺失和未使用的翻译键。

## 特性

- 🔍 **缺失键检测** - 检测源代码中使用但翻译文件中缺失的翻译键
- 🧹 **未使用键检测** - 查找翻译文件中定义但代码中从未使用的翻译键
- 🚀 **构建集成** - 在 Vite 构建过程中自动运行
- 🌍 **多语言支持** - 检查多种语言之间的一致性
- 📦 **多命名空间支持** - 支持将翻译组织到多个命名空间中
- 📝 **TypeScript 支持** - 完整的 TypeScript 支持和类型定义
- ⚡ **快速轻量** - 对构建性能影响最小

## 安装

```bash
npm install vite-plugin-i18next-checker --save-dev
# 或
yarn add vite-plugin-i18next-checker -D
# 或
pnpm add vite-plugin-i18next-checker -D
```

## 快速开始

在你的 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from 'vite'
import { i18nextChecker } from 'vite-plugin-i18next-checker'

export default defineConfig({
  plugins: [
    i18nextChecker({
      srcDir: 'src',
      localeDir: 'public/locales',
      languages: ['en-US', 'zh-CN'],
      namespaces: ['common', 'dashboard'],
    }),
  ],
})
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `srcDir` | `string` | `'source'` | 要扫描翻译键的源代码目录路径 |
| `localeDir` | `string` | `'public/locale'` | 包含翻译 JSON 文件的目录 |
| `languages` | `string[]` | `['zh-CN', 'en-US']` | 要检查的语言代码数组 |
| `namespaces` | `string[]` | `['console']` | 命名空间文件名数组（不含 .json 扩展名）|
| `failOnError` | `boolean` | `false` | 发现缺失键时是否使构建失败 |
| `checkUnused` | `boolean` | `true` | 是否检查未使用的翻译键 |
| `removeUnused` | `boolean` | `false` | 是否自动从语言文件中删除未使用的键（仅在 `checkUnused` 为 `true` 时有效）|

## 目录结构

插件期望你的翻译文件按以下方式组织：

```text
project/
├── src/                          # 源代码 (srcDir)
│   ├── components/
│   └── pages/
├── public/
│   └── locales/                  # 翻译文件 (localeDir)
│       ├── en-US/
│       │   ├── common.json
│       │   └── dashboard.json
│       └── zh-CN/
│           ├── common.json
│           └── dashboard.json
└── vite.config.ts
```

## 翻译文件格式

翻译文件应该是具有嵌套键值对的 JSON 文件：

### public/locales/en-US/common.json

```json
{
  "button": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit"
  },
  "message": {
    "success": "Operation successful",
    "error": "Operation failed"
  }
}
```

### public/locales/zh-CN/common.json

```json
{
  "button": {
    "save": "保存",
    "cancel": "取消",
    "submit": "提交"
  },
  "message": {
    "success": "操作成功",
    "error": "操作失败"
  }
}
```

## 支持的代码模式

插件会自动检测源代码中使用 `t()` 函数的翻译键：

```typescript
// 简单键
t('button.save')
t('message.success')

// 使用点号的嵌套键
t('user.profile.title')

// 适用于任何名为 't' 的变量
const { t } = useTranslation()
t('common.greeting')

// 也支持不同的引号
t("button.cancel")
t(`message.error`)
```

**注意：** 不支持带有模板字面量或变量的动态键：

```typescript
// ❌ 不支持
t(`message.${type}`)
t(dynamicKey)
```

## 示例输出

当插件检测到问题时，它会显示详细信息：

### 缺失的键

```text
📍 Language [en-US] missing translation keys (2 keys):
  ❌ button.delete
     Used at: src/components/Button.tsx:15
  ❌ message.warning
     Used at: src/utils/notify.ts:23
```

### 未使用的键

```text
🗑️  Language [zh-CN] unused translation keys (3 keys):
  ⚠️  old.feature.title
  ⚠️  deprecated.message
  ⚠️  unused.label
```

### 成功

```text
✅ i18n check passed! All translation keys match.
   - Used keys: 48
   - en-US defined keys: 48
   - zh-CN defined keys: 48
```

## 高级配置

```typescript
import { defineConfig } from 'vite'
import { i18nextChecker } from 'vite-plugin-i18next-checker'

export default defineConfig({
  plugins: [
    i18nextChecker({
      // 源代码目录
      srcDir: 'src',
      
      // 翻译文件目录
      localeDir: 'public/locales',
      
      // 要验证的语言
      languages: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'],
      
      // 命名空间文件（每种语言都应该有这些 JSON 文件）
      namespaces: ['common', 'dashboard', 'settings', 'errors'],
      
      // 在生产环境中如果键缺失则构建失败
      failOnError: process.env.NODE_ENV === 'production',
      
      // 检查未使用的键（有助于清理）
      checkUnused: true,
      
      // 自动从语言文件中删除未使用的键
      // ⚠️ 谨慎使用！这会修改你的语言文件
      removeUnused: false,
    }),
  ],
})
```

## 自动清理未使用的键

插件可以自动从语言文件中删除未使用的翻译键。这对于维护干净的翻译文件和删除已弃用或过时的键非常有用。

### 使用方法

启用 `removeUnused` 选项：

```typescript
i18nextChecker({
  checkUnused: true,    // 必须启用
  removeUnused: true,   // 启用自动清理
})
```

### 工作原理

1. 插件扫描你的源代码以找到所有实际使用的翻译键
2. 将这些键与语言文件中定义的键进行比较
3. 当启用 `removeUnused` 时，它会删除源代码中未找到的所有键
4. 语言文件会以正确的 JSON 格式重新写入

### 重要提示

⚠️ **谨慎使用！** 此功能会修改你的语言文件：

- 确保你有备份或使用版本控制（Git）
- 键将从文件中永久删除
- 删除后变为空的嵌套对象也会被删除
- 此功能仅在 `checkUnused` 设置为 `true` 时有效

### 示例

**清理前** (`public/locales/zh-CN/common.json`)：

```json
{
  "button": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除"
  },
  "deprecated": {
    "oldFeature": "旧功能"
  }
}
```

如果你的代码中只使用了 `button.save` 和 `button.cancel`，**清理后**：

```json
{
  "button": {
    "save": "保存",
    "cancel": "取消"
  }
}
```

注意 `button.delete` 被删除了，整个 `deprecated` 对象也被删除了，因为它没有任何被使用的键。

## 开发

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
npm run test:coverage
```

### 类型检查

```bash
npm run typecheck
```

## 许可证

MIT © [yinxulai](https://github.com/yinxulai)

## 贡献

欢迎贡献、提issue和功能请求！

随时查看 [issues 页面](https://github.com/yinxulai/vite-plugin-i18next-checker/issues)。
