import { useQuery } from '@pinia/colada'
import { isInstalledPwa } from '~/data/offline/installed'
import { localRecipeStore } from '~/data/recipes/localStore'
import { recipeTagKeys } from '~/queries/recipes'

/** Recipe tags for filtering, kept on the device in the installed app so filters work offline. */
export const useRecipeTags = () => {
  const source = useRecipeSource()
  const tags = useQuery({
    key: recipeTagKeys.all,
    query: ({ signal }) => source.listTags({ signal })
  })
  if (isInstalledPwa()) {
    const { user } = useUserSession()
    // Server-rendered tags never pass through the source, so store them here too
    watch(tags.data, (list) => {
      const owner = user.value?.id
      if (list && owner) localRecipeStore.replaceTags(list, owner).catch(() => {})
    }, { immediate: true })
  }
  return tags
}
