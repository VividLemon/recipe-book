import type {
  ListRecipesApiQuery,
  RecipePageResponse,
  RecipeTagWeb,
  RecipeWeb
} from '../../../types/recipe'

export interface RecipeSourceOptions {
  /** Aborts the request; an aborted request never writes to the device. */
  signal?: AbortSignal
}

/** A list page, marked when it was answered by the device instead of the API. */
export type RecipeListPage = RecipePageResponse & { fromDevice?: true }

/** Read access to recipes, independent of where they come from (network or device). */
export interface RecipeSource {
  listPage(query: ListRecipesApiQuery, options?: RecipeSourceOptions): Promise<RecipeListPage>
  get(id: string, options?: RecipeSourceOptions): Promise<RecipeWeb | null>
  listTags(options?: RecipeSourceOptions): Promise<RecipeTagWeb[]>
}
