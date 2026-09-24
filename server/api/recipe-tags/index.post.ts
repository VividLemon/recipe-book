import { useRecipeTagsRepository } from '../../recipe-tags/repository'
import type { RecipeTagData } from '../../../types/recipe'
import { recipeTags } from '../../utils/validation'
import { v7 } from 'uuid'

export default defineEventHandler(async (event) => {
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

  const storage = useRecipeTagsRepository()
  await storage.set(recipeTag)
  setResponseStatus(event, 201)
})
