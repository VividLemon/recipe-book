import type { ConsolaReporter } from 'consola'
import { resolveStdoutReporters } from './reporters/stdout'

export const defaultLoggingDestination = 'stdout' as const

export type LoggingRuntimeConfig = {
  destinations?: string
}

export type ReporterFactoryContext = {
  defaultReporters: ConsolaReporter[]
}

export type ReporterFactory = (
  ctx: ReporterFactoryContext
) => ConsolaReporter | ConsolaReporter[]

export const defaultReporterFactories = {
  stdout: ({ defaultReporters }) => resolveStdoutReporters(defaultReporters)
} satisfies Record<string, ReporterFactory>

export const parseLoggingDestinations = (input?: string): string[] => {
  const destinations = (input ?? '')
    .split(',')
    .map((destination) => destination.trim().toLowerCase())
    .filter(Boolean)

  if (destinations.length === 0) return [defaultLoggingDestination]

  return [...new Set(destinations)]
}

export const resolveConsolaReporters = ({
  destinations,
  defaultReporters,
  reporterFactories = defaultReporterFactories
}: {
  destinations: string[]
  defaultReporters: ConsolaReporter[]
  reporterFactories?: Record<string, ReporterFactory>
}): ConsolaReporter[] => destinations.flatMap((destination) => {
  const reporterFactory = reporterFactories[destination]
  if (!reporterFactory) {
    throw new Error(
      `Unsupported logging destination "${destination}". Supported destinations: ${Object.keys(reporterFactories).join(', ')}.`
    )
  }

  const reporter = reporterFactory({ defaultReporters })
  return Array.isArray(reporter) ? reporter : [reporter]
})
