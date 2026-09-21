import { describe, expect, it, vi } from 'vitest'
import type { ConsolaReporter } from 'consola'
import {
  defaultReporterFactories,
  parseLoggingDestinations,
  resolveConsolaReporters
} from '../../server/utils/logging/config'

const createReporter = (): ConsolaReporter => ({
  log: vi.fn()
})

describe('logging config', () => {
  it('defaults to stdout when destinations are missing', () => {
    expect(parseLoggingDestinations()).toEqual(['stdout'])
    expect(parseLoggingDestinations('')).toEqual(['stdout'])
  })

  it('normalizes, trims, and de-duplicates destinations', () => {
    expect(parseLoggingDestinations(' stdout, DATADOG,stdout , datadog ')).toEqual([
      'stdout',
      'datadog'
    ])
  })

  it('reuses the captured stdout reporters by default', () => {
    const defaultReporters = [createReporter(), createReporter()]

    const reporters = resolveConsolaReporters({
      destinations: ['stdout'],
      defaultReporters
    })

    expect(reporters).toEqual(defaultReporters)
    expect(reporters).not.toBe(defaultReporters)
  })

  it('composes multiple resolved destinations in order', () => {
    const stdoutReporter = createReporter()
    const customReporter = createReporter()

    const reporters = resolveConsolaReporters({
      destinations: ['stdout', 'custom'],
      defaultReporters: [stdoutReporter],
      reporterFactories: {
        ...defaultReporterFactories,
        custom: () => customReporter
      }
    })

    expect(reporters).toEqual([stdoutReporter, customReporter])
  })

  it('rejects unknown destinations', () => {
    expect(() => resolveConsolaReporters({
      destinations: ['unknown'],
      defaultReporters: [createReporter()]
    })).toThrow(/Unsupported logging destination "unknown"/)
  })
})
