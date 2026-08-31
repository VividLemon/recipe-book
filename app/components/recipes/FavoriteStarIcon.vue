<template>
  <StarIcon :class="{ 'text-warning': hasFavorite(id) }" />
</template>

<script setup lang="ts">
import StarIcon from '~icons/bi/star'

defineProps<{
  id: string
}>()

const { hasFavorite } = useFavoriteRecipe()
</script>
