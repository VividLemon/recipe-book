import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { consola, type ConsolaReporter } from 'consola'
import {
  parseLoggingDestinations,
  resolveConsolaReporters,
  type LoggingRuntimeConfig,
  type ReporterFactory
} from '../utils/logging/config'

type LoggerWithReporters = typeof consola & {
  options?: {
    reporters?: ConsolaReporter[]
  }
  setReporters: (reporters: ConsolaReporter | ConsolaReporter[]) => unknown
}

export const configureServerLogging = ({
  logger = consola as LoggerWithReporters,
  logging = {},
  reporterFactories
}: {
  logger?: LoggerWithReporters
  logging?: LoggingRuntimeConfig
  reporterFactories?: Record<string, ReporterFactory>
}) => {
  const defaultReporters = [...(logger.options?.reporters ?? [])]
  const destinations = parseLoggingDestinations(logging.destinations)
  const reporters = resolveConsolaReporters({
    destinations,
    defaultReporters,
    reporterFactories
  })

  logger.setReporters(reporters.length === 1 ? reporters[0] : reporters)

  return { destinations, reporters }
}

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  configureServerLogging({
    logging: config.logging
  })
})
