// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    'unplugin-icons/nuxt',
    '@bootstrap-vue-next/nuxt',
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@pinia/colada-nuxt',
    '@pinia/nuxt',
    '@vee-validate/nuxt',
    '@vueuse/nuxt',
    'nuxt-zod-i18n'
  ],
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
    ]
  },
  css: ['bootstrap/dist/css/bootstrap.min.css'],

  runtimeConfig: {
    // Which unstorage driver `server/plugins/storage.ts` mounts for the
    // `recipes`, `recipeTags` and `photos` storage namespaces. Overridable
    // per-environment via the `NUXT_STORAGE_DRIVER` env var. Supported
    // values: 'fs' | 'memory' | 's3'.
    storageDriver: 'fs',
    // Base directory used by the `fs` driver, one subdirectory per namespace.
    storageDir: './.data',
    // Used by the `s3` driver for the `photos` namespace (e.g. to drop in an
    // S3 bucket in a real deployment). Overridable via `NUXT_S3_*` env vars.
    s3: {
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      region: '',
      bucket: ''
    }
  },

  // CI (and any other Vitest run) sets `NODE_ENV=test`, which Nuxt/Nitro
  // automatically overlays on top of the config above - forcing all storage
  // namespaces to the in-memory driver without any code branching.
  $test: {
    runtimeConfig: {
      storageDriver: 'memory'
    }
  }
})

