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
 * Logger for formatted output
 */
class Logger {
  private static readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  }

  static title(text: string) {
    console.log(`\n${this.colors.bright}${this.colors.cyan}${text}${this.colors.reset}`)
  }

  static success(text: string) {
    console.log(`${this.colors.green}✓${this.colors.reset} ${text}`)
  }

  static error(text: string) {
    console.log(`${this.colors.red}✗${this.colors.reset} ${text}`)
  }

  static warning(text: string) {
    console.log(`${this.colors.yellow}⚠${this.colors.reset} ${text}`)
  }

  static info(text: string) {
    console.log(`${this.colors.gray}${text}${this.colors.reset}`)
  }

  static dim(text: string) {
    console.log(`${this.colors.dim}${text}${this.colors.reset}`)
  }

  static divider() {
    console.log(`${this.colors.gray}${'─'.repeat(60)}${this.colors.reset}`)
  }

  static summary(text: string) {
    console.log(`\n${this.colors.bright}${text}${this.colors.reset}`)
  }
}

/**
 * Compare and report differences with real-time output
 */
export function reportDifferences(
  usedKeys: I18nKey[],
  localeKeys: Map<string, Set<string>>,
  options: Required<I18nextCheckerOptions>
): CheckResult {
  const usedKeySet = new Set(usedKeys.map(k => k.key))
  let hasErrors = false
  const missingKeys = new Map<string, string[]>()
  const unusedKeys = new Map<string, string[]>()
  let totalMissing = 0
  let totalUnused = 0

  // Header
  Logger.title('🌍 i18next Translation Checker')
  Logger.info(`   Scanning ${usedKeySet.size} translation keys across ${localeKeys.size} languages`)
  Logger.divider()

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

    // Real-time output for this language
    console.log(`\n${Logger['colors'].blue}Language: ${lang}${Logger['colors'].reset}`)
    Logger.info(`  Defined keys: ${definedKeys.size} | Used keys: ${usedKeySet.size}`)

    // Report missing keys in real-time
    if (missing.length > 0) {
      hasErrors = true
      missingKeys.set(lang, missing)
      totalMissing += missing.length

      console.log(`  ${Logger['colors'].red}Missing translations: ${missing.length}${Logger['colors'].reset}`)

      missing.sort().forEach(key => {
        const usage = usedKeys.find(k => k.key === key)
        if (usage) {
          Logger.error(`${key}`)
          Logger.dim(`    └─ ${usage.file}:${usage.line}`)
        }
      })
    } else {
      Logger.success('All translations present')
    }

    // Report unused keys in real-time
    if (options.checkUnused) {
      if (unused.length > 0) {
        unusedKeys.set(lang, unused)
        totalUnused += unused.length

        console.log(`  ${Logger['colors'].yellow}Unused translations: ${unused.length}${Logger['colors'].reset}`)

        const displayLimit = 10
        unused.sort().slice(0, displayLimit).forEach(key => {
          Logger.warning(`${key}`)
        })
        if (unused.length > displayLimit) {
          Logger.dim(`    ... and ${unused.length - displayLimit} more`)
        }
      } else {
        Logger.success('No unused translations')
      }
    }
  }

  // Summary section
  Logger.divider()
  Logger.summary('📊 Summary')

  if (hasErrors) {
    console.log(`${Logger['colors'].red}✗ Check failed${Logger['colors'].reset}`)
    console.log(`  ${Logger['colors'].red}Missing: ${totalMissing}${Logger['colors'].reset}`)
    if (totalUnused > 0) {
      console.log(`  ${Logger['colors'].yellow}Unused: ${totalUnused}${Logger['colors'].reset}`)
    }
  } else if (totalUnused > 0) {
    console.log(`${Logger['colors'].green}✓ All required translations present${Logger['colors'].reset}`)
    console.log(`  ${Logger['colors'].yellow}Unused: ${totalUnused}${Logger['colors'].reset}`)
  } else {
    console.log(`${Logger['colors'].green}✓ Perfect! All translations match${Logger['colors'].reset}`)
    console.log(`  ${Logger['colors'].green}Keys checked: ${usedKeySet.size}${Logger['colors'].reset}`)
  }

  console.log('') // Empty line at the end

  return {
    hasErrors,
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

      // Compare and report (output is handled internally)
      const { hasErrors } = reportDifferences(usedKeys, localeKeys, opts)

      if (hasErrors && opts.failOnError) {
        throw new Error('i18next check failed: missing translation keys found')
      }
    },
  }
}
