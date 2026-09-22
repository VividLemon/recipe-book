import { consola, type ConsolaReporter } from 'consola'
import { useRuntimeConfig } from '#imports'

export type StdoutReporterOptions = Record<string, never>
export type DatadogReporterOptions = {
  apiKey?: string
  service?: string
}
export type ReporterOptionsMap = {
  stdout: StdoutReporterOptions
  datadog: DatadogReporterOptions
}
export type LoggingRuntimeConfig = Partial<ReporterOptionsMap>
export type ReporterFactoryContext = {
  defaultReporters: ConsolaReporter[]
}

type ReporterFactory<Options> = (
  options: Options,
  ctx: ReporterFactoryContext
) => ConsolaReporter | ConsolaReporter[]

const reporters = {
  stdout: (_opts) => ({
    log: () => {
      // Not implemented because I don't use it, just a placeholder.
    }
  }),
  datadog: (_opts) => ({
    log: () => {
      // Not implemented because I don't use it, just a placeholder.
    }
  })
} as const satisfies { [K in keyof ReporterOptionsMap]: ReporterFactory<ReporterOptionsMap[K]> }

export type ReporterName = keyof typeof reporters

export default defineNitroPlugin(() => {
  const runtime = useRuntimeConfig()
  const logging = (runtime.logging ?? {}) as LoggingRuntimeConfig

  (Object.keys(logging) as ReporterName[])
    .filter((name) => name in reporters)
    .forEach((name) => {
      // @ts-expect-error - TS doesn't know that `name` is a key of `logging` here, but it is.
      if(logging[name]) consola.addReporter(reporters[name](logging[name]))
    })
})
