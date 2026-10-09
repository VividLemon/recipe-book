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
    '@vite-pwa/nuxt',
    '@vueuse/nuxt'
  ],
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
    ]
  },
  css: ['bootstrap/dist/css/bootstrap.min.css'],

  app: {
    head: {
      meta: [{ name: 'theme-color', content: '#ffffff' }]
    }
  },

  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Recipe Book',
      short_name: 'Recipes',
      description: 'Your recipes, available even when offline.',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          // Recipe photos: serve from cache first, they rarely change
          urlPattern: ({ url }) => url.pathname.startsWith('/api/photos/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'recipe-photos',
            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [200] }
          }
        },
        {
          // Recipes and tags: prefer fresh data, fall back to local copies
          urlPattern: ({ url, request }) =>
            request.method === 'GET'
            && (url.pathname.startsWith('/api/recipes')
              || url.pathname.startsWith('/api/recipe-tags')),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'recipe-data',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [200] }
          }
        }
      ]
    },
    client: { installPrompt: true },
    devOptions: { enabled: false }
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
