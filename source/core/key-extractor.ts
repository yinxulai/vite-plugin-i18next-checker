import type { I18nKey } from '../types'
import { scanDirectory } from '../utils/file-system'
import * as fs from 'node:fs'

/**
 * Extract i18next translation keys from source code
 */
export class KeyExtractor {
  // Match t('key') or t("key") or t(`key`)
  private readonly tFunctionRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g

  /**
   * Extract all i18n keys from a source directory
   */
  extract(srcDir: string): I18nKey[] {
    const keys: I18nKey[] = []

    scanDirectory(srcDir, (filePath) => {
      this.extractFromFile(filePath, keys)
    })

    return keys
  }

  /**
   * Extract keys from a single file
   */
  private extractFromFile(filePath: string, keys: I18nKey[]): void {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      const regex = new RegExp(this.tFunctionRegex)
      let match

      while ((match = regex.exec(line)) !== null) {
        const key = match[1]
        // Skip keys containing variable interpolation
        if (key && !this.hasInterpolation(key)) {
          keys.push({
            key,
            file: filePath,
            line: index + 1,
          })
        }
      }
    })
  }

  /**
   * Check if key contains variable interpolation
   */
  private hasInterpolation(key: string): boolean {
    return key.includes('${') || key.includes('{{')
  }
}
