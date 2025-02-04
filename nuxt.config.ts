import type { MongoDbOptions } from 'unstorage/drivers/mongodb'

const imageTypes = [
  'JPEG',
  'JPG',
  'PNG',
  'WebP',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]
const acceptedImageTypes = [
  ...new Set(
    imageTypes.flatMap((el) => [el.toUpperCase(), el.toLowerCase(), el])
  )
]
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
      siteName: 'My Recipe Book',
      picture: {
        acceptedImageTypes
      }
    },
    picture: {
      storageDir: 'public'
    }
  },
  nitro: {
    storage: {
      recipes: {
        driver: 'mongodb',
        connectionString: 'mongodb://localhost:27017/',
        collectionName: 'recipes',
        databaseName: 'recipeBook'
      } satisfies MongoDbOptions & { driver: 'mongodb' },
      recipeTags: {
        driver: 'mongodb',
        connectionString: 'mongodb://localhost:27017/',
        collectionName: 'recipeTags',
        databaseName: 'recipeBook'
      }
    }
  }
})
