import { offlineShellUrl } from './app/data/offline/cacheNames'

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
    'nuxt-auth-utils',
    '@pinia/colada-nuxt',
    '@pinia/nuxt',
    '@vee-validate/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt'
  ],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Recipe Book',
      short_name: 'Recipes',
      theme_color: '#0d6efd',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
      ]
    },
    // Custom worker (app/service-worker/sw.ts): it precaches build assets and
    // only reads caches; it never stores pages or API responses.
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    injectManifest: {
      globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'],
      rollupFormat: 'iife'
    },
    client: {
      installPrompt: false,
      // Registered by app/plugins/offline.client.ts, and only in the installed app
      registerPlugin: false
    },
    devOptions: {
      enabled: false
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
    ]
  },
  css: ['bootstrap/dist/css/bootstrap.min.css'],

  routeRules: {
    // Client-rendered, so the offline shell's HTML never embeds a session
    [offlineShellUrl]: { ssr: false }
  },

  runtimeConfig: {
    documentBackend: 'filesystem',
    fileBackend: 'filesystem',
    logging: {
      stdout: {}
    },
    storageDir: './.data',
    legacyRecipeOwnerId: '',
    mongodb: {
      uri: '',
      database: 'recipe-book',
      recipesCollection: 'recipes',
      recipeTagsCollection: 'recipeTags',
      usersCollection: 'users'
    }
  },

  $test: {
    runtimeConfig: {
      documentBackend: 'memory',
      fileBackend: 'memory'
    }
  }
})
