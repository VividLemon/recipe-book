<template>
  <StarIcon :class="{ 'text-warning': isFavorite(id) }" />
</template>

<script setup lang="ts">
import StarIcon from '~icons/bi/star'

defineProps<{
  id: string
}>()

const { isFavorite } = useFavoriteRecipe()
</script>
