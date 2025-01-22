<template>
  <BTable
    :items="formattedRecipes"
    :fields="['name', 'difficulty', 'time', 'Actions']"
  >
    <template #cell(Actions)="row">
      <BLink :to="`/recipes/${row.item.id}`">View</BLink>
      <BLink class="ms-1" :to="`/recipes/edit/${row.item.id}`">Edit</BLink>
    </template>
  </BTable>
</template>

<script setup lang="ts">
import type { ReadRecipeResponse } from '~/types/recipe'

const props = defineProps<{
  recipes: ReadRecipeResponse
}>()

const formattedRecipes = useFormattedRecipe(() => props.recipes)
</script>
