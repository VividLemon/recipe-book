<template>
  <BCardGroup columns>
    <BCard
      v-for="recipe in recipes"
      :key="recipe.id"
      :title="recipe.name"
      :img-src="recipe.photo?.thumbnail"
      style="width: 250px"
    >
      <BBadge v-for="tag in recipe.tags" :key="tag.id" class="ms-1">
        {{ tag.text }}
      </BBadge>

      <!-- Footer -->
      <template #footer>
        <BButtonGroup class="w-100">
          <BButton :to="`/recipes/${recipe.id}`" class="w-75">View</BButton>
          <BButton :variant="null" @click="toggleFavorite(recipe.id)">
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
</script>
