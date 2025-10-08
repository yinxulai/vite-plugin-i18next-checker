import * as path from 'node:path'
import type { I18nextCheckerOptions, CheckResult } from '../types'
import { KeyExtractor } from './key-extractor'
import { LocaleReader } from './locale-reader'
import { KeyComparator } from './key-comparator'
import { KeyCleaner } from './key-cleaner'
import { Logger } from '../logger'

/**
 * Main checker orchestrator
 */
export class I18nextChecker {
  private readonly options: Required<I18nextCheckerOptions>
  private readonly extractor = new KeyExtractor()
  private readonly reader = new LocaleReader()
  private readonly comparator = new KeyComparator()
  private readonly cleaner = new KeyCleaner()

  constructor(options: I18nextCheckerOptions = {}) {
    this.options = {
      srcDir: options.srcDir ?? 'source',
      localeDir: options.localeDir ?? 'public/locale',
      languages: options.languages ?? ['zh-CN', 'en-US'],
      namespaces: options.namespaces ?? ['console'],
      failOnError: options.failOnError ?? false,
      checkUnused: options.checkUnused ?? true,
      removeUnused: options.removeUnused ?? false,
    }
  }

  /**
   * Run the full check process
   */
  check(projectRoot: string): CheckResult {
    const srcPath = path.resolve(projectRoot, this.options.srcDir)
    const localePath = path.resolve(projectRoot, this.options.localeDir)

    // Step 1: Extract keys from source code
    const usedKeys = this.extractor.extract(srcPath)

    // Step 2: Read locale files
    const definedKeys = this.reader.read(
      localePath,
      this.options.languages,
      this.options.namespaces
    )

    // Step 3: Compare and analyze
    const result = this.comparator.compare(usedKeys, definedKeys, {
      checkUnused: this.options.checkUnused,
    })

    // Step 4: Report results
    this.comparator.report(usedKeys, result, this.options.removeUnused)

    // Step 5: Clean unused keys if requested
    if (this.options.removeUnused && this.options.checkUnused) {
      const totalUnused = Array.from(result.unusedKeys.values())
        .reduce((sum, arr) => sum + arr.length, 0)

      if (totalUnused > 0) {
        Logger.divider()
        Logger.title('🧹 Cleaning unused translations')
        Logger.divider()

        const removed = this.cleaner.clean(
          localePath,
          this.options.languages,
          this.options.namespaces,
          result.usedKeys,
          true // verbose
        )

        if (removed > 0) {
          Logger.divider()
          Logger.success(`Total: Removed ${removed} unused translation(s)`)
        }
      }
    }

    // Step 6: Handle errors
    if (result.hasErrors && this.options.failOnError) {
      throw new Error('i18next check failed: missing translation keys found')
    }

    return result
  }

  /**
   * Get the current options
   */
  getOptions(): Required<I18nextCheckerOptions> {
    return { ...this.options }
  }
}
