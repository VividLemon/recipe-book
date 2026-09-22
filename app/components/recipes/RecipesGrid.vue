<template>
  <BContainer>
    <BRow>
      <BCol v-for="recipe in formattedRecipes" :key="recipe.id" sm="4" lg="4">
        <BCard
          :title="recipe.name"
          :img-alt="recipe.name"
          img-height="250"
        >
          <picture v-if="recipe.photos?.coverImage?.thumbnail">
            <source :srcset="recipe.photos.coverImage.thumbnail.avif" type="image/avif">
            <source :srcset="recipe.photos.coverImage.thumbnail.webp" type="image/webp">
            <img
              class="card-img-top"
              :src="recipe.photos.coverImage.thumbnail.original"
              :alt="recipe.name"
              height="250"
            >
          </picture>
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
              <BButton class="w-75" @click="emit('open-recipe', recipe.id)"
                >View</BButton
              >
              <BButton
                variant="outline-secondary"
                aria-label="Toggle favorite recipe"
                @click="toggleFavorite(recipe.id)"
              >
                <RecipesFavoriteStarIcon :id="recipe.id" />
              </BButton>
            </BButtonGroup>
          </template>
        </BCard>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import { RecipesFavoriteStarIcon } from '#components'
import { breakpointsBootstrapV5 } from '@vueuse/core'
import type { ReadRecipeResponse } from '../../../types/recipe'

const props = defineProps<{
  recipes: ReadRecipeResponse
  perRow: number | 'auto'
}>()

const emit = defineEmits<{
  'open-recipe': [id: string]
}>()

const isMounted = useMounted() // used by breakpoints

const { toggleFavorite } = useFavoriteRecipe()

const { active } = useBreakpoints(breakpointsBootstrapV5)
const activeBreakpoint = active()
const autoBreakpoints = {
  lg: 4,
  md: 3,
  sm: 2,
  xs: 1,
  xl: 4,
  xxl: 4,
  '': 1
} as const satisfies Record<typeof activeBreakpoint.value, number>
const chunkSize = computed(() => {
  if (!isMounted.value) return 0
  if (typeof props.perRow === 'number') return props.perRow
  return autoBreakpoints[activeBreakpoint.value] || 1
})
const formattedRecipes = useFormattedRecipe(() => Array(10).fill(props.recipes).flat())
</script>
