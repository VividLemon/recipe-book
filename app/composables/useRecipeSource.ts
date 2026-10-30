import type { RecipeWeb } from '../../types/recipe'
import { isInstalledPwa } from '~/data/offline/installed'
import { createHttpRecipeSource } from '~/data/recipes/httpSource'
import { createLocalRecipeSource } from '~/data/recipes/localSource'
import { localRecipeStore } from '~/data/recipes/localStore'
import type { RecipeSource } from '~/data/recipes/types'
import { withOfflineFallback } from '~/data/recipes/withOfflineFallback'

/**
 * Single entry point for reading recipes. It is the API, except in the
 * installed app, where a device copy of the user's own recipes answers when
 * the network does not.
 */
export const useRecipeSource = (): RecipeSource => {
  const remote = createHttpRecipeSource(useRequestFetch())
  if (!isInstalledPwa()) return remote

  const userId = useSessionUserId()
  return withOfflineFallback(remote, createLocalRecipeSource(localRecipeStore, userId), localRecipeStore, { userId })
}

const useSessionUserId = () => {
  const { user } = useUserSession()
  return () => user.value?.id ?? null
}

/**
 * In the installed app, copies the user's own recipes that reached the page
 * without a client request (server rendered payload) to the device.
 */
export const useKeepRecipesOnDevice = (recipes: MaybeRefOrGetter<RecipeWeb[]>) => {
  if (!isInstalledPwa()) return
  const userId = useSessionUserId()
  watch(() => toValue(recipes), (list) => {
    const owner = userId()
    const own = list.filter((recipe) => recipe.ownerId === owner && !recipe.id.startsWith('optimistic-'))
    if (owner) localRecipeStore.putRecipes(own, owner).catch(() => {})
  }, { immediate: true })
}
