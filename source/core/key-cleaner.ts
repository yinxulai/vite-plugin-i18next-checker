import * as path from 'node:path'
import type { LocaleData } from '../types'
import { parseJsonFile, writeFileSafe } from '../utils/file-system'
import { removeUnusedKeysFromObject } from '../utils/object-utils'
import { Logger } from '../logger'

/**
 * Clean unused translation keys from locale files
 */
export class KeyCleaner {
  /**
   * Remove unused keys from locale files
   * @returns Total number of keys removed
   */
  clean(
    localeDir: string,
    languages: string[],
    namespaces: string[],
    usedKeys: Set<string>,
    verbose = false
  ): number {
    let totalRemoved = 0

    for (const lang of languages) {
      for (const namespace of namespaces) {
        const removed = this.cleanFile(
          localeDir,
          lang,
          namespace,
          usedKeys,
          verbose
        )
        totalRemoved += removed
      }
    }

    return totalRemoved
  }

  /**
   * Clean a single locale file
   */
  private cleanFile(
    localeDir: string,
    language: string,
    namespace: string,
    usedKeys: Set<string>,
    verbose: boolean
  ): number {
    const filePath = path.join(localeDir, language, `${namespace}.json`)
    const data = parseJsonFile<LocaleData>(filePath)

    if (!data) {
      return 0
    }

    const { cleaned, removed } = removeUnusedKeysFromObject(data, usedKeys)

    // Log each removed key if verbose
    if (verbose) {
      for (const key of removed) {
        Logger.success(`[${language}/${namespace}] Removed: ${key}`)
      }
    }

    // Write back to file if any keys were removed
    if (removed.length > 0) {
      const content = JSON.stringify(cleaned, null, 2) + '\n'
      const success = writeFileSafe(filePath, content)
      
      if (!success) {
        Logger.error(`Failed to write ${filePath}`)
        return 0
      }
    }

    return removed.length
  }
}
