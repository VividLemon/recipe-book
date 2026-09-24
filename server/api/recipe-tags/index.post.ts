import { useRecipeTagsRepository } from '../../recipe-tags/repository'
import type { RecipeTagData } from '../../../types/recipe'
import { mapRecipeTagDataToWeb } from '../../utils/mappers'
import { recipeTags } from '../../utils/validation'
import { v7 } from 'uuid'

export default defineEventHandler(async (event) => {
  const storage = useRecipeTagsRepository()
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

  await storage.set(recipeTag)
  setResponseStatus(event, 201)
  return mapRecipeTagDataToWeb(recipeTag)
})
