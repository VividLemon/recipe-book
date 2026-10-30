import type {
  ListRecipesApiQuery,
  RecipePageResponse,
  RecipeTagWeb,
  RecipeWeb
} from '../../../types/recipe'

/** Read access to recipes, independent of where they come from (network or device). */
export interface RecipeSource {
  listPage(query: ListRecipesApiQuery): Promise<RecipePageResponse>
  get(id: string): Promise<RecipeWeb | null>
  listTags(): Promise<RecipeTagWeb[]>
}
