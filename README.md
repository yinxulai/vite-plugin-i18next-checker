# vite-plugin-i18next-checker

[![CI](https://github.com/yinxulai/vite-plugin-i18next-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/yinxulai/vite-plugin-i18next-checker/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/vite-plugin-i18next-checker.svg)](https://www.npmjs.com/package/vite-plugin-i18next-checker)
[![codecov](https://codecov.io/gh/yinxulai/vite-plugin-i18next-checker/branch/main/graph/badge.svg)](https://codecov.io/gh/yinxulai/vite-plugin-i18next-checker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

English | [中文](./README.zh-CN.md)

A Vite plugin for checking i18next translation key consistency. It helps you find missing and unused translation keys during the build process.

## Features

- 🔍 **Missing Key Detection** - Detect translation keys used in source code but missing from translation files
- 🧹 **Unused Key Detection** - Find translation keys defined in files but never used in code
- 🚀 **Build Integration** - Automatically runs during Vite build process
- 🌍 **Multi-Language Support** - Check consistency across multiple languages
- 📦 **Multi-Namespace Support** - Support for organizing translations into multiple namespaces
- 📝 **TypeScript Support** - Full TypeScript support with type definitions
- ⚡ **Fast & Lightweight** - Minimal performance impact on your build

## Installation

```bash
npm install vite-plugin-i18next-checker --save-dev
```

or

```bash
yarn add vite-plugin-i18next-checker -D
```

or

```bash
pnpm add vite-plugin-i18next-checker -D
```

## Quick Start

Add the plugin to your `vite.config.ts`:

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

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `srcDir` | `string` | `'source'` | Source code directory path to scan for translation keys |
| `localeDir` | `string` | `'public/locale'` | Directory containing translation JSON files |
| `languages` | `string[]` | `['zh-CN', 'en-US']` | Array of language codes to check |
| `namespaces` | `string[]` | `['console']` | Array of namespace file names (without .json extension) |
| `failOnError` | `boolean` | `false` | Whether to fail the build when missing keys are found |
| `checkUnused` | `boolean` | `true` | Whether to check for unused translation keys |

## Directory Structure

The plugin expects your translation files to be organized as follows:

```text
project/
├── src/                          # Source code (srcDir)
│   ├── components/
│   └── pages/
├── public/
│   └── locales/                  # Translation files (localeDir)
│       ├── en-US/
│       │   ├── common.json
│       │   └── dashboard.json
│       └── zh-CN/
│           ├── common.json
│           └── dashboard.json
└── vite.config.ts
```

## Translation File Format

Translation files should be JSON files with nested key-value pairs:

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

## Supported Code Patterns

The plugin automatically detects translation keys in your source code using the `t()` function:

```typescript
// Simple keys
t('button.save')
t('message.success')

// Nested keys with dot notation
t('user.profile.title')

// Works with any variable named 't'
const { t } = useTranslation()
t('common.greeting')

// Also works with quotes
t("button.cancel")
t(`message.error`)
```

**Note:** Dynamic keys with template literals or variables are not supported:

```typescript
// ❌ Not supported
t(`message.${type}`)
t(dynamicKey)
```

## Example Output

When the plugin detects issues, it will display detailed information:

### Missing Keys

```text
📍 Language [en-US] missing translation keys (2 keys):
  ❌ button.delete
     Used at: src/components/Button.tsx:15
  ❌ message.warning
     Used at: src/utils/notify.ts:23
```

### Unused Keys

```text
🗑️  Language [zh-CN] unused translation keys (3 keys):
  ⚠️  old.feature.title
  ⚠️  deprecated.message
  ⚠️  unused.label
```

### Success

```text
✅ i18n check passed! All translation keys match.
- Used keys: 48
- en-US defined keys: 48
- zh-CN defined keys: 48
```

## Advanced Configuration

```typescript
import { defineConfig } from 'vite'
import { i18nextChecker } from 'vite-plugin-i18next-checker'

export default defineConfig({
  plugins: [
    i18nextChecker({
      // Source code directory
      srcDir: 'src',
      
      // Translation files directory
      localeDir: 'public/locales',
      
      // Languages to validate
      languages: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'],
      
      // Namespace files (each language should have these JSON files)
      namespaces: ['common', 'dashboard', 'settings', 'errors'],
      
      // Fail build in production if keys are missing
      failOnError: process.env.NODE_ENV === 'production',
      
      // Check for unused keys (helpful for cleanup)
      checkUnused: true,
    }),
  ],
})
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

## License

MIT © [yinxulai](https://github.com/yinxulai)

## Contributing

Contributions, issues and feature requests are welcome!

Feel free to check the [issues page](https://github.com/yinxulai/vite-plugin-i18next-checker/issues).
