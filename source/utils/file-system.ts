import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * File system utilities
 */

export interface ScanOptions {
  extensions: string[]
  excludeDirs: string[]
}

const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'output'],
}

/**
 * Recursively scan directory and execute callback for each file
 */
export function scanDirectory(
  dir: string,
  onFile: (filePath: string) => void,
  options: Partial<ScanOptions> = {}
): void {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options }
  
  if (!fs.existsSync(dir)) {
    return
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (!opts.excludeDirs.includes(entry.name)) {
        scanDirectory(fullPath, onFile, options)
      }
    } else if (opts.extensions.some(ext => entry.name.endsWith(ext))) {
      onFile(fullPath)
    }
  }
}

/**
 * Read file content safely
 * @returns File content or null if file doesn't exist or reading fails
 */
export function readFileSafe(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Write file content safely
 * @returns true if successful, false otherwise
 */
export function writeFileSafe(filePath: string, content: string): boolean {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  } catch {
    return false
  }
}

/**
 * Parse JSON file safely
 * @returns Parsed data or null if parsing fails
 */
export function parseJsonFile<T>(filePath: string): T | null {
  const content = readFileSafe(filePath)
  if (!content) {
    return null
  }

  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}
