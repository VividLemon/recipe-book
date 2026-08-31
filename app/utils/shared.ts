export const maximumRecipeStepsPhotoDimensions = {
  width: 100,
  height: 100
} as const

export const recipeTagIdToRecipeTag = <T extends { id: string }>(
  ids: string[],
  tags: T[]
): T[] =>
  ids
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is T => Boolean(tag))

export const stringBooleanToBoolean = (str: 'true' | 'false') => str === 'true'
