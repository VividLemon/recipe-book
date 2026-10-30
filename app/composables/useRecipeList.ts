import { useInfiniteQuery } from '@pinia/colada'
import { RECIPE_STALE_TIME, recipeKeys } from '~/queries/recipes'
import { flattenRecipePages } from '~/queries/recipeCache'
import type { RecipeListPage } from '~/data/recipes/types'
import { mapRecipeListQueryToApi, type RecipeListQuery } from '~/utils/recipeQuery'

/**
 * Cached, paginated recipe list. The key excludes the page, so changing the
 * URL-backed filters/sort switches to a fresh accumulation of pages.
 */
export const useRecipeList = (query: MaybeRefOrGetter<RecipeListQuery>) =>
  {
    const source = useRecipeSource()
    const infinite = useInfiniteQuery({
      key: () => recipeKeys.list(mapRecipeListQueryToApi(toValue(query), 1)),
      query: ({ pageParam, signal }): Promise<RecipeListPage> =>
        source.listPage(mapRecipeListQueryToApi(toValue(query), pageParam), { signal }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage,
      staleTime: RECIPE_STALE_TIME
    })

    // The device holds a different (smaller) result set than the API, so page
    // numbers from one do not continue the other. When the answering side
    // changes between pages, reload every page from the side answering now.
    watch(infinite.data, (data) => {
      const sides = new Set(data?.pages.map((page) => !!page.fromDevice))
      if (sides.size > 1 && infinite.asyncStatus.value !== 'loading') infinite.refetch()
    })

    const items = computed(() => flattenRecipePages(infinite.data.value))
    useKeepRecipesOnDevice(items)
    return { ...infinite, items }
  }
