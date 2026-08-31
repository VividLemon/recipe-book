import type { ColorVariant } from 'bootstrap-vue-next'
import type { Recipe } from '../../types/recipe.ts'

const map: Record<Recipe['difficulty'], ColorVariant> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger'
} as const

export const useRecipeDifficultyVariant = (
  difficulty: MaybeRefOrGetter<Recipe['difficulty']>
) => computed(() => map[toValue(difficulty)])
