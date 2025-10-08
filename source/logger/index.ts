/**
 * Logger for formatted console output with colors
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const

export class Logger {
  static title(text: string): void {
    console.log(`\n${colors.bright}${colors.cyan}${text}${colors.reset}`)
  }

  static success(text: string): void {
    console.log(`${colors.green}✓${colors.reset} ${text}`)
  }

  static error(text: string): void {
    console.log(`${colors.red}✗${colors.reset} ${text}`)
  }

  static warning(text: string): void {
    console.log(`${colors.yellow}⚠${colors.reset} ${text}`)
  }

  static info(text: string): void {
    console.log(`${colors.gray}${text}${colors.reset}`)
  }

  static dim(text: string): void {
    console.log(`${colors.dim}${text}${colors.reset}`)
  }

  static divider(): void {
    console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`)
  }

  static summary(text: string): void {
    console.log(`\n${colors.bright}${text}${colors.reset}`)
  }

  static language(text: string): void {
    console.log(`\n${colors.blue}${text}${colors.reset}`)
  }

  static sectionTitle(text: string, color: 'red' | 'yellow' = 'red'): void {
    console.log(`  ${colors[color]}${text}${colors.reset}`)
  }

  static plain(text: string): void {
    console.log(text)
  }
}
