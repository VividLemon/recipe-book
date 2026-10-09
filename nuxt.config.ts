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
    installPrompt: 'recipe-book:pwa-install-dismissed',
    manifest: {
      name: 'Recipe Book',
      short_name: 'Recipes',
      description: 'Your recipes, available anywhere.',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: '/^\\/api\\/recipes(?:\\/.*)?$/',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'recipe-api',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
          }
        },
        {
          urlPattern: '/^\\/api\\/photos\\/.*$/',
          handler: 'CacheFirst',
          options: {
            cacheName: 'recipe-images',
            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 }
          }
        }
      ]
    },
    devOptions: { enabled: true }
  },
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
    ]
  },
  css: ['bootstrap/dist/css/bootstrap.min.css'],

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
