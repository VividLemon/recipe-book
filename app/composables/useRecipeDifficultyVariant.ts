import type { ColorVariant } from 'bootstrap-vue-next'
import type { RecipeWeb } from '../../types/recipe.ts'

const map: Record<RecipeWeb['difficulty'], ColorVariant> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger'
} as const

export const useRecipeDifficultyVariant = (
  difficulty: MaybeRefOrGetter<RecipeWeb['difficulty']>
) => computed(() => map[toValue(difficulty)])
