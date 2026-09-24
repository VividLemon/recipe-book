import { createRecipeTag } from '../../recipe-tags/service'
import { recipeTags } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(
    event,
    recipeTags.create.body.parseAsync
  )

  await createRecipeTag(input)
  setResponseStatus(event, 201)
})
