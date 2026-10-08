import {
  mapRecipeListQueryToApi,
  parseRecipeListQuery,
  serializeRecipeListQuery,
  type RecipeListQuery
} from '~/utils/recipeQuery'

/** Two-way binding between the URL query string and the recipe list query. */
export const useRecipeListRoute = () => {
  const route = useRoute()
  const router = useRouter()

  const query = computed(() => parseRecipeListQuery(route.query))
  const apiQuery = computed(() => mapRecipeListQueryToApi(query.value))

  const update = (patch: Partial<RecipeListQuery>, options: { replace?: boolean } = {}) => {
    const next = serializeRecipeListQuery({ ...query.value, ...patch })
    const keep = { ...route.query }
    for (const key of ['name', 'tag', 'difficulty', 'sortBy', 'sortOrder']) delete keep[key]
    const navigate = options.replace ? router.replace : router.push
    return navigate.call(router, { path: route.path, query: { ...keep, ...next } })
  }

  return { query, apiQuery, update }
}
