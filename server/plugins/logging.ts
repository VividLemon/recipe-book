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
    reporters?: ConsolaReporter | ConsolaReporter[]
  }
  setReporters: (reporters: ConsolaReporter | ConsolaReporter[]) => unknown
}

const configuredLoggingStateKey = Symbol.for('recipe-book.logging.state')

const toReporterArray = (
  reporters?: ConsolaReporter | ConsolaReporter[]
): ConsolaReporter[] => Array.isArray(reporters)
  ? [...reporters]
  : reporters
    ? [reporters]
    : []

export const configureServerLogging = ({
  logger = consola as LoggerWithReporters,
  logging = {},
  reporterFactories
}: {
  logger?: LoggerWithReporters
  logging?: LoggingRuntimeConfig
  reporterFactories?: Record<string, ReporterFactory>
}) => {
  const destinations = parseLoggingDestinations(logging.destinations)
  const destinationsKey = destinations.join(',')
  const defaultReporters = toReporterArray(logger.options?.reporters)
  const reporters = resolveConsolaReporters({
    destinations,
    defaultReporters,
    reporterFactories
  })

  const configurationState = (logger as typeof logger & {
    [configuredLoggingStateKey]?: {
      destinationsKey: string
      reporters: ConsolaReporter[]
    }
  })[configuredLoggingStateKey]

  const hasSameReporters = defaultReporters.length === reporters.length
    && defaultReporters.every((reporter, index) => reporter === reporters[index])
  const alreadyConfigured = configurationState?.destinationsKey === destinationsKey
    && configurationState.reporters.length === defaultReporters.length
    && configurationState.reporters.every((reporter, index) => reporter === defaultReporters[index])

  if (!alreadyConfigured || !hasSameReporters) {
    logger.setReporters(reporters)
    ;(logger as typeof logger & {
      [configuredLoggingStateKey]: {
        destinationsKey: string
        reporters: ConsolaReporter[]
      }
    })[configuredLoggingStateKey] = {
      destinationsKey,
      reporters: [...reporters]
    }
  }

  return { destinations, reporters }
}

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  configureServerLogging({
    logging: config.logging
  })
})
