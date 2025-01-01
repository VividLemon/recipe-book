import { useRecipeTagsStorage } from '../../utils/mongo'
import type { RecipeTag } from '../../../types/recipe'
import { recipeTags } from '../../utils/validation'
import { v4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const storage = useRecipeTagsStorage()
  const input = await readValidatedBody(
    event,
    recipeTags.create.body.parseAsync
  )

  const id = v4()
  const recipeTag: RecipeTag = {
    ...input,
    id,
    createdAt: Date.now()
  }

  await storage.setItem(id, recipeTag)
  setResponseStatus(event, 201)
  return recipeTag
})
