import { useQuery } from '@pinia/colada'
import { toValue, type MaybeRefOrGetter } from 'vue'
import type { RecipeWeb } from '../../types/recipe'

export const useRecipe = (id: MaybeRefOrGetter<string>) =>
  useQuery({
    key: () => ['recipe', toValue(id)],
    query: () => $fetch<RecipeWeb | null>(`/api/recipes/${toValue(id)}`),
    staleTime: 60_000
  })
