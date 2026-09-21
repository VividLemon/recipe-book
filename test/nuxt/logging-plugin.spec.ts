import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConsolaReporter } from 'consola'

const { mockedConsola } = vi.hoisted(() => ({
  mockedConsola: {
    options: {
      reporters: [] as ConsolaReporter[]
    },
    setReporters: vi.fn()
  }
}))

const useRuntimeConfig = vi.fn()

vi.mock('nitropack/runtime', () => ({
  defineNitroPlugin: <T>(plugin: T) => plugin,
  useRuntimeConfig
}))

vi.mock('consola', () => ({
  consola: mockedConsola
}))

const createReporter = (): ConsolaReporter => ({
  log: vi.fn()
})

describe('logging Nitro plugin', () => {
  beforeEach(() => {
    vi.resetModules()
    useRuntimeConfig.mockReset()
    mockedConsola.options.reporters = []
    mockedConsola.setReporters.mockReset()
  })

  it('configures stdout reporters from runtime config at startup', async () => {
    useRuntimeConfig.mockReturnValue({
      logging: {
        destinations: 'stdout'
      }
    })

    const { default: plugin } = await import('../../server/plugins/logging')
    const defaultReporter = createReporter()
    mockedConsola.options.reporters = [defaultReporter]

    plugin({} as never)

    expect(useRuntimeConfig).toHaveBeenCalledTimes(1)
    expect(mockedConsola.setReporters).toHaveBeenCalledTimes(1)
    expect(mockedConsola.setReporters).toHaveBeenCalledWith(defaultReporter)
  })

  it('preserves multiple default stdout reporters at startup', async () => {
    useRuntimeConfig.mockReturnValue({
      logging: {
        destinations: 'stdout'
      }
    })

    const { default: plugin } = await import('../../server/plugins/logging')
    const defaultReporters = [createReporter(), createReporter()]
    mockedConsola.options.reporters = defaultReporters

    plugin({} as never)

    expect(mockedConsola.setReporters).toHaveBeenCalledTimes(1)
    expect(mockedConsola.setReporters).toHaveBeenCalledWith(defaultReporters)
  })

  it('fails fast for invalid startup destinations', async () => {
    useRuntimeConfig.mockReturnValue({
      logging: {
        destinations: 'stdout,unknown'
      }
    })

    const { default: plugin } = await import('../../server/plugins/logging')

    expect(() => plugin({} as never)).toThrow(/Unsupported logging destination "unknown"/)
  })
})
