export interface I18nextCheckerOptions {
  /**
   * Source code directory path
   * @default 'source'
   */
  srcDir?: string

  /**
   * Locale files directory path
   * @default 'public/locale'
   */
  localeDir?: string

  /**
   * List of languages to check
   * @default ['zh-CN', 'en-US']
   */
  languages?: string[]

  /**
   * Namespace file names (without extension)
   * @default ['console']
   */
  namespaces?: string[]

  /**
   * Whether to fail on build errors
   * @default false
   */
  failOnError?: boolean

  /**
   * Whether to check for unused keys
   * @default true
   */
  checkUnused?: boolean
}

export interface I18nKey {
  key: string
  file: string
  line: number
  namespace?: string
}

export interface LocaleData {
  [key: string]: unknown
}

export interface CheckResult {
  hasErrors: boolean
  usedKeys: Set<string>
  unusedKeys: Map<string, string[]>
  missingKeys: Map<string, string[]>
  definedKeys: Map<string, Set<string>>
}
