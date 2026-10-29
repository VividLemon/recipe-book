import type { RecipeWeb } from '../../types/recipe'
import { createHttpRecipeSource } from '~/data/recipes/httpSource'
import { createLocalRecipeSource } from '~/data/recipes/localSource'
import { localRecipeStore } from '~/data/recipes/localStore'
import type { RecipeSource } from '~/data/recipes/types'
import { withOfflineFallback } from '~/data/recipes/withOfflineFallback'

/**
 * Single entry point for reading recipes. On the server it is the API; in the
 * browser the API is backed by a device copy of the user's own recipes, which
 * answers when the network does not.
 */
export const useRecipeSource = (): RecipeSource => {
  const remote = createHttpRecipeSource(useRequestFetch())
  if (import.meta.server) return remote

  return withOfflineFallback(remote, createLocalRecipeSource(localRecipeStore), localRecipeStore, {
    keep: useIsOwnRecipe()
  })
}

/** Only the signed-in user's own recipes are kept on the device. */
const useIsOwnRecipe = () => {
  const { user } = useUserSession()
  return (recipe: RecipeWeb) => !!user.value && recipe.ownerId === user.value.id
}

/**
 * Copies recipes that reached the page without a client request (server
 * rendered payload) to the device, so they are available offline too.
 */
export const useKeepRecipesOnDevice = (recipes: MaybeRefOrGetter<RecipeWeb[]>) => {
  if (import.meta.server) return
  const isOwnRecipe = useIsOwnRecipe()
  watch(() => toValue(recipes), (list) => {
    localRecipeStore.putRecipes(list.filter(isOwnRecipe)).catch(() => {})
  }, { immediate: true })
}
