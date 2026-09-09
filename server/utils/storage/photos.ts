// Agnostic photo storage. The actual backend (filesystem, in-memory, S3, ...)
// is determined by the `photos` mount configured in `nuxt.config.ts` /
// `server/plugins/storage.ts` - this helper never assumes a specific driver.
export const usePhotoStorage = () => useStorage('photos')
