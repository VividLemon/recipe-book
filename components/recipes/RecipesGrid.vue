<template>
  <BCardGroup
    v-for="(chunk, ind) in chunkedRecipes"
    :key="ind"
    deck
    class="mb-3"
  >
    <BCard
      v-for="recipe in chunk"
      :key="recipe.id"
      :title="recipe.name"
      :img-src="recipe.photos?.coverImage?.thumbnail"
      :img-alt="recipe.name"
      :style="!sm || !isMounted ? undefined : 'width: 250px'"
    >
      <div>Time: {{ recipe.time }}</div>

      <BBadge
        v-for="tag in recipe.tags"
        :key="tag.id"
        :variant="tag.variant"
        class="ms-1"
      >
        {{ tag.text }}
      </BBadge>

      <!-- Footer -->
      <template #footer>
        <BButtonGroup class="w-100">
          <BButton :to="`/recipes/${recipe.id}`" class="w-75">View</BButton>
          <BButton
            variant="outline-secondary"
            @click="toggleFavorite(recipe.id)"
          >
            <StarIcon :class="{ 'text-warning': isFavorite(recipe.id) }" />
          </BButton>
        </BButtonGroup>
      </template>
    </BCard>
  </BCardGroup>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5 } from '@vueuse/core'
import type { ReadRecipeResponse } from '~/types/recipe'
import StarIcon from '~icons/bi/star'

const props = defineProps<{
  recipes: ReadRecipeResponse
  perRow: number | 'auto'
}>()

const isMounted = useMounted() // used by breakpoints

const { isFavorite, toggleFavorite } = useFavoriteRecipe()

const { sm, active } = useBreakpoints(breakpointsBootstrapV5)
const activeBreakpoint = active()
const mappedBreakpointsToChunkSizes = {
  lg: 4,
  md: 3,
  sm: 2,
  xs: 1,
  xl: 4,
  xxl: 4,
  '': 1
} satisfies Record<typeof activeBreakpoint.value, number>
const chunkSize = computed(() => {
  if (!isMounted.value) return 0
  if (typeof props.perRow === 'number') return props.perRow
  return mappedBreakpointsToChunkSizes[activeBreakpoint.value] || 1
})
const formattedRecipes = useFormattedRecipe(() => props.recipes)
const chunkedRecipes = computed(() =>
  chunkArray(formattedRecipes.value, chunkSize.value)
)
</script>
