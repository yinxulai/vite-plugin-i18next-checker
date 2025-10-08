import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Plugin } from 'vite'
import type { I18nextCheckerOptions, I18nKey, LocaleData, CheckResult } from './types'

/**
 * Flatten nested object into dot-separated key-value pairs
 */
export function flattenObject(obj: LocaleData, prefix = ''): Set<string> {
  const keys = new Set<string>()

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenObject(value as LocaleData, fullKey)
      nested.forEach(k => keys.add(k))
    } else {
      keys.add(fullKey)
    }
  }

  return keys
}

/**
 * Extract all i18next keys from source code
 */
export function extractI18nKeys(srcDir: string): I18nKey[] {
  const keys: I18nKey[] = []
  const fileExtensions = ['.ts', '.tsx', '.js', '.jsx']

  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
      return
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip node_modules and other directories that don't need scanning
        if (!['node_modules', '.git', 'dist', 'build', 'output'].includes(entry.name)) {
          scanDirectory(fullPath)
        }
      } else if (fileExtensions.some(ext => entry.name.endsWith(ext))) {
        extractKeysFromFile(fullPath)
      }
    }
  }

  function extractKeysFromFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    // Match t('key') or t("key") or t(`key`)
    const tFunctionRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g

    lines.forEach((line, index) => {
      let match
      const regex = new RegExp(tFunctionRegex)
      while ((match = regex.exec(line)) !== null) {
        const key = match[1]
        // Skip keys containing variable interpolation
        if (key && !key.includes('${') && !key.includes('{{')) {
          keys.push({
            key,
            file: filePath,
            line: index + 1,
          })
        }
      }
    })
  }

  scanDirectory(srcDir)
  return keys
}

/**
 * Read locale JSON files
 */
export function readLocaleFiles(
  localeDir: string,
  languages: string[],
  namespaces: string[]
): Map<string, Set<string>> {
  const localeKeys = new Map<string, Set<string>>()

  for (const lang of languages) {
    const allKeys = new Set<string>()

    for (const namespace of namespaces) {
      const filePath = path.join(localeDir, lang, `${namespace}.json`)

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const data = JSON.parse(content) as LocaleData
          const keys = flattenObject(data)
          keys.forEach(k => allKeys.add(k))
        } catch (error) {
          console.error(`[i18n-checker] Failed to parse ${filePath}:`, error)
        }
      }
    }

    localeKeys.set(lang, allKeys)
  }

  return localeKeys
}

/**
 * Compare and report differences
 */
export function reportDifferences(
  usedKeys: I18nKey[],
  localeKeys: Map<string, Set<string>>,
  options: Required<I18nextCheckerOptions>
): CheckResult {
  const usedKeySet = new Set(usedKeys.map(k => k.key))
  const messages: string[] = []
  let hasErrors = false
  const missingKeys = new Map<string, string[]>()
  const unusedKeys = new Map<string, string[]>()

  // Check each language
  for (const [lang, definedKeys] of localeKeys) {
    const missing: string[] = []
    const unused: string[] = []

    // Check for missing keys
    for (const used of usedKeySet) {
      if (!definedKeys.has(used)) {
        missing.push(used)
      }
    }

    // Check for unused keys
    if (options.checkUnused) {
      for (const defined of definedKeys) {
        if (!usedKeySet.has(defined)) {
          unused.push(defined)
        }
      }
    }

    if (missing.length > 0) {
      hasErrors = true
      missingKeys.set(lang, missing)
      messages.push(`\n📍 Language [${lang}] missing translation keys (${missing.length} keys):`)
      missing.sort().forEach(key => {
        const usage = usedKeys.find(k => k.key === key)
        if (usage) {
          messages.push(`  ❌ ${key}`)
          messages.push(`     Used at: ${usage.file}:${usage.line}`)
        }
      })
    }

    if (unused.length > 0 && options.checkUnused) {
      unusedKeys.set(lang, unused)
      messages.push(`\n🗑️  Language [${lang}] unused translation keys (${unused.length} keys):`)
      unused.sort().slice(0, 20).forEach(key => {
        messages.push(`  ⚠️  ${key}`)
      })
      if (unused.length > 20) {
        messages.push(`  ... and ${unused.length - 20} more unused keys`)
      }
    }
  }

  // Statistics
  if (messages.length === 0) {
    messages.push('\n✅ i18next check passed! All translation keys match.')
    messages.push(`   - Used keys: ${usedKeySet.size}`)
    for (const [lang, keys] of localeKeys) {
      messages.push(`   - ${lang} defined keys: ${keys.size}`)
    }
  }

  return {
    hasErrors,
    report: messages.join('\n'),
    missingKeys,
    unusedKeys,
    usedKeys: usedKeySet,
    definedKeys: localeKeys,
  }
}

/**
 * Vite plugin: Check i18next key consistency
 */
export function i18nextChecker(options: I18nextCheckerOptions = {}): Plugin {
  const opts: Required<I18nextCheckerOptions> = {
    srcDir: options.srcDir ?? 'source',
    localeDir: options.localeDir ?? 'public/locale',
    languages: options.languages ?? ['zh-CN', 'en-US'],
    namespaces: options.namespaces ?? ['console'],
    failOnError: options.failOnError ?? false,
    checkUnused: options.checkUnused ?? true,
  }

  let projectRoot = ''

  return {
    name: 'vite-plugin-i18next-checker',

    configResolved(config) {
      projectRoot = config.root
    },

    buildStart() {
      const srcPath = path.resolve(projectRoot, opts.srcDir)
      const localePath = path.resolve(projectRoot, opts.localeDir)

      // Extract keys used in source code
      const usedKeys = extractI18nKeys(srcPath)

      // Read locale files
      const localeKeys = readLocaleFiles(localePath, opts.languages, opts.namespaces)

      // Compare and report
      const { hasErrors, report } = reportDifferences(usedKeys, localeKeys, opts)

      console.log(report)

      if (hasErrors && opts.failOnError) {
        throw new Error('i18next check failed: missing translation keys found')
      }
    },
  }
}
