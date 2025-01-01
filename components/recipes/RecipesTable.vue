<template>
  <BTable :items="recipes" :fields="['name', 'difficulty', 'time', 'Actions']">
    <template #cell(Actions)="row">
      <BLink :to="`/recipes/${row.item.id}`">View</BLink>
    </template>
  </BTable>
</template>

<script setup lang="ts">
import type { ReadRecipeResponse } from '~/types/recipe'

defineProps<{
  recipes: ReadRecipeResponse
}>()
</script>
