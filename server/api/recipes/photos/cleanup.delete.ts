import {
  getValidatedPhotoStorageDir,
  recipePhotoPrefix
} from '../../../utils/photo'
import { getAllRecipes } from '../../../utils/shared'
import { readdir, unlink } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const promise = async () => {
    try {
      throw new Error('Not implemented')
      const recipes = await getAllRecipes()
      const allImages = new Set(
        recipes.flatMap((el) => [
          ...Object.values(el?.photos?.coverImage ?? {}),
          ...(el?.photos?.stepsImages ?? [])
        ])
      )
      const { dir, error } = getValidatedPhotoStorageDir(event)
      if (error) throw error
      const files = await readdir(dir)
      await Promise.all(
        files.map((el) => {
          if (el.startsWith(recipePhotoPrefix) && !allImages.has(el)) {
            return unlink(`${dir}/${el}`)
          }
          return Promise.resolve()
        })
      )
    } catch (e) {
      console.error('Error cleaning up photos:', e)
    }
  }
  event.waitUntil(promise())
  setResponseStatus(event, 204)
})
