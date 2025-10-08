import type { Plugin } from 'vite'
import type { I18nextCheckerOptions } from './types'
import { I18nextChecker } from './core/checker'

// Export types
export type { I18nextCheckerOptions, I18nKey, LocaleData, CheckResult } from './types'

// Export main checker class
export { I18nextChecker } from './core/checker'

/**
 * Vite plugin: Check i18next key consistency
 */
export function i18nextChecker(options: I18nextCheckerOptions = {}): Plugin {
  let checker: I18nextChecker | undefined
  let projectRoot = ''

  return {
    name: 'vite-plugin-i18next-checker',

    configResolved(config) {
      projectRoot = config.root
      checker = new I18nextChecker(options)
    },

    buildStart() {
      // Initialize checker if not already initialized (fallback to cwd)
      if (!checker) {
        checker = new I18nextChecker(options)
        projectRoot = process.cwd()
      }
      checker.check(projectRoot)
    },
  }
}
