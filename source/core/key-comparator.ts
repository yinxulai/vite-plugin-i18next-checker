import type { I18nKey, CheckResult } from '../types'
import { Logger } from '../logger'

export interface ComparisonOptions {
  checkUnused: boolean
}

/**
 * Compare and analyze differences between used and defined translation keys
 */
export class KeyComparator {
  /**
   * Compare used keys against defined keys and generate a report
   */
  compare(
    usedKeys: I18nKey[],
    definedKeys: Map<string, Set<string>>,
    options: ComparisonOptions
  ): CheckResult {
    const usedKeySet = new Set(usedKeys.map(k => k.key))
    const missingKeys = new Map<string, string[]>()
    const unusedKeys = new Map<string, string[]>()
    let hasErrors = false

    // Analyze each language
    for (const [lang, langKeys] of definedKeys) {
      const analysis = this.analyzeLanguage(usedKeySet, langKeys, options.checkUnused)
      
      if (analysis.missing.length > 0) {
        missingKeys.set(lang, analysis.missing)
        hasErrors = true
      }

      if (analysis.unused.length > 0) {
        unusedKeys.set(lang, analysis.unused)
      }
    }

    return {
      hasErrors,
      usedKeys: usedKeySet,
      definedKeys,
      missingKeys,
      unusedKeys,
    }
  }

  /**
   * Generate and display report
   */
  report(
    usedKeys: I18nKey[],
    result: CheckResult,
    shouldRemoveUnused: boolean
  ): void {
    const { hasErrors, missingKeys, unusedKeys, usedKeys: usedKeySet, definedKeys } = result
    const totalMissing = Array.from(missingKeys.values()).reduce((sum, arr) => sum + arr.length, 0)
    const totalUnused = Array.from(unusedKeys.values()).reduce((sum, arr) => sum + arr.length, 0)

    // Quick success path
    if (!hasErrors && totalUnused === 0) {
      Logger.success('✓ All translation keys are in sync')
      return
    }

    // Detailed report header
    Logger.title('🌍 i18next Translation Checker')
    Logger.info(`   Scanning ${usedKeySet.size} translation keys across ${definedKeys.size} languages`)
    Logger.divider()

    // Report for each language
    for (const [lang, langKeys] of definedKeys) {
      this.reportLanguage(lang, langKeys, usedKeySet, missingKeys, unusedKeys, usedKeys)
    }

    // Summary
    Logger.divider()
    Logger.summary('📊 Summary')

    if (hasErrors) {
      Logger.error('Check failed')
      Logger.info(`  Missing: ${totalMissing}`)
      if (totalUnused > 0 && !shouldRemoveUnused) {
        Logger.info(`  Unused: ${totalUnused}`)
      }
    } else if (totalUnused > 0 && !shouldRemoveUnused) {
      Logger.success('All required translations present')
      Logger.info(`  Unused: ${totalUnused}`)
    } else {
      Logger.success('Perfect! All translations match')
      Logger.info(`  Keys checked: ${usedKeySet.size}`)
    }

    Logger.plain('')
  }

  /**
   * Analyze a single language
   */
  private analyzeLanguage(
    usedKeys: Set<string>,
    definedKeys: Set<string>,
    checkUnused: boolean
  ): { missing: string[]; unused: string[] } {
    const missing: string[] = []
    const unused: string[] = []

    // Find missing keys
    for (const key of usedKeys) {
      if (!definedKeys.has(key)) {
        missing.push(key)
      }
    }

    // Find unused keys
    if (checkUnused) {
      for (const key of definedKeys) {
        if (!usedKeys.has(key)) {
          unused.push(key)
        }
      }
    }

    return { missing, unused }
  }

  /**
   * Report for a single language
   */
  private reportLanguage(
    language: string,
    definedKeys: Set<string>,
    usedKeys: Set<string>,
    missingKeys: Map<string, string[]>,
    unusedKeys: Map<string, string[]>,
    usedKeysList: I18nKey[]
  ): void {
    const missing = missingKeys.get(language) || []
    const unused = unusedKeys.get(language) || []

    // Skip languages with no issues
    if (missing.length === 0 && unused.length === 0) {
      return
    }

    Logger.language(`Language: ${language}`)
    Logger.info(`  Defined keys: ${definedKeys.size} | Used keys: ${usedKeys.size}`)

    // Report missing keys
    if (missing.length > 0) {
      Logger.sectionTitle('Missing translations:', 'red')
      for (const key of missing) {
        const usage = usedKeysList.find(k => k.key === key)
        Logger.error(`${key}`)
        if (usage) {
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
}
