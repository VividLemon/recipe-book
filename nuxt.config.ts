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
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#198754' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/pwa-icon.svg' }
      ]
    }
  },
  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Recipe Book',
      short_name: 'Recipes',
      description: 'Your recipes, available wherever you cook.',
      theme_color: '#198754',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/pwa-icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,avif}']
    },
    client: {
      installPrompt: false
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
