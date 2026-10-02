import { useStorageRepositories } from '../storage/container'
import type { FileEngine } from '../storage/contracts'

export const usePhotoFiles = (): FileEngine => useStorageRepositories().photos
