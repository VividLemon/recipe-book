<template>
  <BContainer>
    <BRow>
      <BCol> Recipes </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormInput v-model="search" />
      </BCol>
    </BRow>
    {{ filtered }}
  </BContainer>
</template>

<script setup lang="ts">
const search = ref('')

const recipes = await useFetch('/api/recipes')

const filtered = computed(
  () =>
    recipes.data.value?.filter((recipe) =>
      recipe.name.includes(search.value)
    ) || []
)
</script>
