import { getRecipeTags } from '../../utils/shared'
import { mapRecipeTagDataToWeb } from '#server/utils/mappers.ts'

export default defineEventHandler(async () => {
  return (await getRecipeTags()).map(mapRecipeTagDataToWeb)
})
