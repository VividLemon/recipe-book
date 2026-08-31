import { useRecipeTagsStorage } from '../../utils/mongo'
import type { RecipeTagData } from '../../../types/recipe'
import { mapRecipeTagDataToWeb } from '../../utils/mappers'
import { recipeTags } from '../../utils/validation'
import { v7 } from 'uuid'

export default defineEventHandler(async (event) => {
  const storage = useRecipeTagsStorage()
  const input = await readValidatedBody(
    event,
    recipeTags.create.body.parseAsync
  )

  const id = v7()
  const recipeTag: RecipeTagData = {
    ...input,
    id,
    createdAt: Date.now()
  }

  await storage.setItem(id, recipeTag)
  setResponseStatus(event, 201)
  return mapRecipeTagDataToWeb(recipeTag)
})
