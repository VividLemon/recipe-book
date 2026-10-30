import { useQuery } from '@pinia/colada'
import { localRecipeStore } from '~/data/recipes/localStore'
import { recipeTagKeys } from '~/queries/recipes'

/** Recipe tags for filtering, kept on the device so filters work offline. */
export const useRecipeTags = () => {
  const source = useRecipeSource()
  const tags = useQuery({
    key: recipeTagKeys.all,
    query: () => source.listTags()
  })
  if (import.meta.client) {
    // Server-rendered tags never pass through the source, so store them here too
    watch(tags.data, (list) => {
      if (list) localRecipeStore.replaceTags(list).catch(() => {})
    }, { immediate: true })
  }
  return tags
}
