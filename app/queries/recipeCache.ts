import type {
  ListRecipesApiQuery,
  RecipePageResponse,
  RecipeTagWeb,
  RecipeWeb
} from '../../types/recipe'

export interface RecipePages {
  pages: RecipePageResponse[]
  pageParams: number[]
}

export const recipeMatchesQuery = (recipe: RecipeWeb, query: ListRecipesApiQuery) => {
  const name = query.name?.trim().toLowerCase()
  return (!name || recipe.name.toLowerCase().includes(name))
    && (!query.tag || recipe.tags.some((tag) => tag.id === query.tag))
    && (!query.difficulty || recipe.difficulty === query.difficulty)
}

/** Replaces a recipe wherever it is cached in the pages. */
export const updateRecipeInPages = (data: RecipePages, recipe: RecipeWeb): RecipePages => ({
  ...data,
  pages: data.pages.map((page) => ({
    ...page,
    items: page.items.map((el) => (el.id === recipe.id ? recipe : el))
  }))
})

export const removeRecipeFromPages = (data: RecipePages, id: string): RecipePages => ({
  ...data,
  pages: data.pages.map((page) => {
    const items = page.items.filter((el) => el.id !== id)
    return items.length === page.items.length
      ? page
      : { ...page, items, total: Math.max(0, page.total - 1) }
  })
})

/** Appends a recipe to the last loaded page, only when no further pages exist. */
export const appendRecipeToPages = (data: RecipePages, recipe: RecipeWeb): RecipePages => {
  const last = data.pages.at(-1)
  if (!last || last.nextPage !== null) return data
  return {
    ...data,
    pages: [
      ...data.pages.slice(0, -1),
      { ...last, items: [...last.items, recipe], total: last.total + 1 }
    ]
  }
}

export const flattenRecipePages = (data: Pick<RecipePages, 'pages'> | undefined) =>
  data?.pages.flatMap((page) => page.items) ?? []

export const buildOptimisticRecipe = (
  input: Pick<RecipeWeb, 'name' | 'ingredients' | 'steps' | 'difficulty' | 'time'> & { tags: string[] },
  tags: RecipeTagWeb[],
  base?: Partial<RecipeWeb> & { id?: string }
): RecipeWeb => {
  const now = Date.now()
  return {
    createdAt: now,
    ...base,
    id: base?.id ?? `optimistic-${now}`,
    updatedAt: now,
    name: input.name,
    ingredients: input.ingredients,
    steps: input.steps,
    difficulty: input.difficulty,
    time: input.time,
    tags: input.tags
      .map((id) => tags.find((tag) => tag.id === id))
      .filter((tag): tag is RecipeTagWeb => !!tag)
  }
}
