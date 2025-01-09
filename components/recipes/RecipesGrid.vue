<template>
  <BCardGroup columns>
    <BCard
      v-for="recipe in recipes"
      :key="recipe.id"
      :title="recipe.name"
      :img-src="recipe.photo?.thumbnail"
      style="width: 250px"
    >
      <div>Time: {{ formatedTime(recipe.time) }}</div>

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
            <ClientOnly>
              <template #fallback>
                <StarIcon />
              </template>
              <StarIcon :class="{ 'text-warning': isFavorite(recipe.id) }" />
            </ClientOnly>
          </BButton>
        </BButtonGroup>
      </template>
    </BCard>
  </BCardGroup>
</template>

<script setup lang="ts">
import type { ReadRecipeResponse } from '~/types/recipe'
import StarIcon from '~icons/bi/star'

defineProps<{
  recipes: ReadRecipeResponse
}>()

const { isFavorite, toggleFavorite } = useFavoriteRecipe()

const formatedTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''}`
  } else {
    return `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
  }
}
</script>
