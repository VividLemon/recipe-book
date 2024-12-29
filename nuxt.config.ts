import type { MongoDbOptions } from 'unstorage/drivers/mongodb'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@bootstrap-vue-next/nuxt',
    '@vueuse/nuxt',
    'unplugin-icons/nuxt',
    '@nuxt/eslint'
  ],
  css: ['bootstrap/dist/css/bootstrap.min.css'],
  runtimeConfig: {
    public: {
      siteName: 'My Recipe Book'
    },
    picture: {
      storageDir: '/public'
    }
  },
  nitro: {
    storage: {
      mongo: {
        driver: 'mongodb',
        connectionString: 'mongodb://localhost:27017/',
        collectionName: 'recipes',
        databaseName: 'recipeBook'
      } satisfies MongoDbOptions & { driver: 'mongodb' }
    }
  }
})
