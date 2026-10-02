import { useInfiniteQuery } from '@pinia/colada'
import type { RecipePageResponse } from '../../types/recipe'
import { RECIPE_STALE_TIME, recipeKeys } from '~/queries/recipes'
import { flattenRecipePages } from '~/queries/recipeCache'
import { mapRecipeListQueryToApi, type RecipeListQuery } from '~/utils/recipeQuery'

/**
 * Cached, paginated recipe list. The key excludes the page, so changing the
 * URL-backed filters/sort switches to a fresh accumulation of pages.
 */
export const useRecipeList = (query: MaybeRefOrGetter<RecipeListQuery>) =>
  {
    const requestFetch = useRequestFetch()
    const infinite = useInfiniteQuery({
      key: () => recipeKeys.list(mapRecipeListQueryToApi(toValue(query), 1)),
      query: ({ pageParam }): Promise<RecipePageResponse> =>
        requestFetch<RecipePageResponse>('/api/recipes', {
          query: mapRecipeListQueryToApi(toValue(query), pageParam)
        }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage,
      staleTime: RECIPE_STALE_TIME
    })
    const items = computed(() => flattenRecipePages(infinite.data.value))
    return { ...infinite, items }
  }
