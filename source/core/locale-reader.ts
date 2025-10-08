import * as path from 'node:path'
import type { LocaleData } from '../types'
import { parseJsonFile } from '../utils/file-system'
import { flattenObject } from '../utils/object-utils'
import { Logger } from '../logger'

/**
 * Read and parse locale translation files
 */
export class LocaleReader {
  /**
   * Read all locale files for given languages and namespaces
   * @returns Map of language to set of translation keys
   */
  read(
    localeDir: string,
    languages: string[],
    namespaces: string[]
  ): Map<string, Set<string>> {
    const localeKeys = new Map<string, Set<string>>()

    for (const lang of languages) {
      const allKeys = this.readLanguage(localeDir, lang, namespaces)
      localeKeys.set(lang, allKeys)
    }

    return localeKeys
  }

  /**
   * Read all namespaces for a single language
   */
  private readLanguage(
    localeDir: string,
    language: string,
    namespaces: string[]
  ): Set<string> {
    const allKeys = new Set<string>()

    for (const namespace of namespaces) {
      const keys = this.readNamespace(localeDir, language, namespace)
      keys.forEach(k => allKeys.add(k))
    }

    return allKeys
  }

  /**
   * Read a single namespace file
   */
  private readNamespace(
    localeDir: string,
    language: string,
    namespace: string
  ): Set<string> {
    const filePath = path.join(localeDir, language, `${namespace}.json`)
    const data = parseJsonFile<LocaleData>(filePath)

    if (!data) {
      Logger.error(`Failed to read or parse ${filePath}`)
      return new Set()
    }

    return flattenObject(data)
  }
}
