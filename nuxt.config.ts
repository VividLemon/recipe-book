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
    workbox: {
      globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'],
      // Pages are server rendered, so there is no prebuilt shell to fall back to.
      // Navigations are cached at runtime instead (see `pages` below).
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 3,
            // Any cached page renders the app; the list itself refetches client side
            matchOptions: { ignoreSearch: true },
            cacheableResponse: { statuses: [200] }
          }
        },
        {
          urlPattern: /\/api\/photos\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'recipe-photos',
            expiration: { maxEntries: 1000 },
            cacheableResponse: { statuses: [200] }
          }
        },
        {
          urlPattern: /\/api\/(recipes|recipe-tags|user\/favorites)(\/[^/]+)?(\?|$)/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'recipe-api',
            networkTimeoutSeconds: 3,
            cacheableResponse: { statuses: [200] }
          }
        }
      ]
    },
    client: {
      installPrompt: false
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
