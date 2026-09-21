import type { ConsolaReporter } from 'consola'

export const resolveStdoutReporters = (
  defaultReporters: ConsolaReporter[]
): ConsolaReporter[] => [...defaultReporters]
