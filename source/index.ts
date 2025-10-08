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
          Logger.error(`Failed to parse ${filePath}: ${error}`)
        }
      }
    }

    localeKeys.set(lang, allKeys)
  }

  return localeKeys
}

/**
 * Remove unused keys from nested object and return the count
 */
function removeUnusedKeysFromObject(
  obj: LocaleData,
  usedKeys: Set<string>,
  prefix = ''
): { cleaned: LocaleData; removed: string[] } {
  const result: LocaleData = {}
  const removed: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      const nested = removeUnusedKeysFromObject(value as LocaleData, usedKeys, fullKey)
      // Collect removed keys from nested objects
      removed.push(...nested.removed)
      // Only include this nested object if it has any keys left
      if (Object.keys(nested.cleaned).length > 0) {
        result[key] = nested.cleaned
      }
    } else {
      // Keep this key if it's used
      if (usedKeys.has(fullKey)) {
        result[key] = value
      } else {
        // Mark as removed
        removed.push(fullKey)
      }
    }
  }

  return { cleaned: result, removed }
}

/**
 * Process and remove unused keys from a single file with real-time reporting
 */
function processLocaleFile(
  filePath: string,
  lang: string,
  namespace: string,
  usedKeys: Set<string>,
  silent = false
): number {
  if (!fs.existsSync(filePath)) {
    return 0
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content) as LocaleData
    
    // Remove unused keys and get the list of removed keys
    const { cleaned, removed } = removeUnusedKeysFromObject(data, usedKeys)

    // Real-time output for each removed key (unless silent mode)
    if (!silent) {
      for (const key of removed) {
        Logger.success(`[${lang}/${namespace}] Removed: ${key}`)
      }
    }

    // Write back to file if any keys were removed
    if (removed.length > 0) {
      fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8')
    }

    return removed.length
  } catch (error) {
    Logger.error(`Failed to process ${filePath}: ${error}`)
    return 0
  }
}

/**
 * Remove unused keys from locale files (exported for testing)
 */
export function removeUnusedKeys(
  localeDir: string,
  languages: string[],
  namespaces: string[],
  usedKeys: Set<string>
): number {
  let totalRemoved = 0
  
  for (const lang of languages) {
    for (const namespace of namespaces) {
      const filePath = path.join(localeDir, lang, `${namespace}.json`)
      const removed = processLocaleFile(filePath, lang, namespace, usedKeys, true)
      totalRemoved += removed
    }
  }
  
  return totalRemoved
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

  static language(text: string) {
    console.log(`\n${this.colors.blue}${text}${this.colors.reset}`)
  }

  static sectionTitle(text: string, color: 'red' | 'yellow' = 'red') {
    console.log(`  ${this.colors[color]}${text}${this.colors.reset}`)
  }

  static plain(text: string) {
    console.log(text)
  }
}

/**
 * Compare and report differences with real-time output
 */
export function reportDifferences(
  usedKeys: I18nKey[],
  localeKeys: Map<string, Set<string>>,
  options: Required<I18nextCheckerOptions>,
  localeDir?: string
): CheckResult {
  const usedKeySet = new Set(usedKeys.map(k => k.key))
  let hasErrors = false
  const missingKeys = new Map<string, string[]>()
  const unusedKeys = new Map<string, string[]>()
  let totalMissing = 0
  let totalUnused = 0

  // First pass: collect all issues
  for (const [lang, definedKeys] of localeKeys) {
    const missing: string[] = []
    const unused: string[] = []

    // Check for missing keys
    for (const used of usedKeySet) {
      if (!definedKeys.has(used)) {
        missing.push(used)
        totalMissing++
        hasErrors = true
      }
    }
    
    if (missing.length > 0) {
      missingKeys.set(lang, missing)
    }

    // Check for unused keys
    if (options.checkUnused) {
      for (const defined of definedKeys) {
        if (!usedKeySet.has(defined)) {
          unused.push(defined)
          totalUnused++
        }
      }
      
      if (unused.length > 0) {
        unusedKeys.set(lang, unused)
      }
    }
  }

  // If no issues found, just print success message and return
  if (!hasErrors && totalUnused === 0) {
    Logger.success('✓ All translation keys are in sync')
    return {
      hasErrors: false,
      missingKeys,
      unusedKeys,
      usedKeys: usedKeySet,
      definedKeys: localeKeys,
    }
  }

  // If there are issues, show detailed report
  Logger.title('🌍 i18next Translation Checker')
  Logger.info(`   Scanning ${usedKeySet.size} translation keys across ${localeKeys.size} languages`)
  Logger.divider()

  // Report issues for each language
  for (const [lang, definedKeys] of localeKeys) {
    const missing = missingKeys.get(lang) || []
    const unused = unusedKeys.get(lang) || []

    // Skip languages with no issues
    if (missing.length === 0 && unused.length === 0) {
      continue
    }

    // Language header
    Logger.language(`Language: ${lang}`)
    Logger.info(`  Defined keys: ${definedKeys.size} | Used keys: ${usedKeySet.size}`)

    // Report missing keys
    if (missing.length > 0) {
      Logger.sectionTitle('Missing translations:', 'red')
      for (const key of missing) {
        const usage = usedKeys.find(k => k.key === key)
        if (usage) {
          Logger.error(`${key}`)
          Logger.dim(`    └─ ${usage.file}:${usage.line}`)
        }
      }
    }

    // Report unused keys
    if (unused.length > 0) {
      Logger.sectionTitle('Unused translations:', 'yellow')
      for (const key of unused) {
        Logger.warning(`${key}`)
      }
    }
  }

  // Remove unused keys if enabled
  if (options.removeUnused && options.checkUnused && totalUnused > 0 && localeDir) {
    Logger.divider()
    Logger.title('🧹 Cleaning unused translations')
    Logger.divider()
    
    let totalRemoved = 0
    
    // Process each file and output real-time
    for (const lang of options.languages) {
      for (const namespace of options.namespaces) {
        const filePath = path.join(localeDir, lang, `${namespace}.json`)
        const removed = processLocaleFile(filePath, lang, namespace, usedKeySet)
        totalRemoved += removed
      }
    }
    
    if (totalRemoved > 0) {
      Logger.divider()
      Logger.success(`Total: Removed ${totalRemoved} unused translation(s)`)
    }
  }

  // Summary section
  Logger.divider()
  Logger.summary('📊 Summary')

  if (hasErrors) {
    Logger.error('Check failed')
    Logger.info(`  Missing: ${totalMissing}`)
    if (totalUnused > 0 && !options.removeUnused) {
      Logger.info(`  Unused: ${totalUnused}`)
    }
  } else if (totalUnused > 0 && !options.removeUnused) {
    Logger.success('All required translations present')
    Logger.info(`  Unused: ${totalUnused}`)
  } else {
    Logger.success('Perfect! All translations match')
    Logger.info(`  Keys checked: ${usedKeySet.size}`)
  }

  Logger.plain('') // Empty line at the end

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
    removeUnused: options.removeUnused ?? false,
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
      const { hasErrors } = reportDifferences(usedKeys, localeKeys, opts, localePath)

      if (hasErrors && opts.failOnError) {
        throw new Error('i18next check failed: missing translation keys found')
      }
    },
  }
}
