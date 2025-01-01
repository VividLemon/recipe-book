<template>
  <BContainer>
    <BRow>
      <BCol> Recipes </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BInputGroup>
          <BFormInput v-model="search" placeholder="Search" />
          <template #append>
            <BButton variant="outline-secondary" @click="onModeClick">
              <TableIcon v-if="!isTableMode" />
              <GridIcon v-else />
            </BButton>
          </template>
        </BInputGroup>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <RecipesGrid v-if="!isTableMode" :recipes="filtered" />
        <RecipesTable v-else :recipes="filtered" />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import TableIcon from '~icons/bi/table'
import GridIcon from '~icons/bi/grid'

const isTableMode = ref(false)
const onModeClick = () => {
  isTableMode.value = !isTableMode.value
}

const search = ref('')

const recipes = await useFetch('/api/recipes')

const filtered = computed(
  () =>
    recipes.data.value?.filter((recipe) =>
      recipe.name?.includes(search.value)
    ) || []
)
</script>
