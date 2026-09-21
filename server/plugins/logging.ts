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
const reporterBaselineKey = Symbol.for('recipe-book.logging.reporter-baseline')

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
  const loggerWithState = logger as typeof logger & {
    [configuredLoggingStateKey]?: {
      destinationsKey: string
      reporters: ConsolaReporter[]
    }
    [reporterBaselineKey]?: ConsolaReporter[]
  }
  const currentReporters = toReporterArray(logger.options?.reporters)
  const defaultReporters = loggerWithState[reporterBaselineKey]
    ? [...loggerWithState[reporterBaselineKey]]
    : currentReporters

  loggerWithState[reporterBaselineKey] = [...defaultReporters]
  const reporters = resolveConsolaReporters({
    destinations,
    defaultReporters,
    reporterFactories
  })

  const configurationState = loggerWithState[configuredLoggingStateKey]

  const hasSameReporters = currentReporters.length === reporters.length
    && currentReporters.every((reporter, index) => reporter === reporters[index])
  const alreadyConfigured = configurationState?.destinationsKey === destinationsKey
    && configurationState.reporters.length === currentReporters.length
    && configurationState.reporters.every((reporter, index) => reporter === currentReporters[index])

  if (!alreadyConfigured || !hasSameReporters) {
    logger.setReporters(reporters)
    loggerWithState[configuredLoggingStateKey] = {
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
