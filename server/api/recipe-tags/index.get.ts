import { getRecipeTags } from '../../recipe-tags/service'
import { mapRecipeTagDataToWeb } from '#server/utils/mappers.ts'

export default defineEventHandler(async () => {
  return (await getRecipeTags()).map(mapRecipeTagDataToWeb)
})
