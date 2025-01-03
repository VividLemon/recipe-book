<template>
  <BContainer>
    <BRow>
      <BCol> Recipes </BCol>
    </BRow>
    <div>
      <BRow class="mb-3 align-items-center">
        <BCol md="4">
          <BFormGroup label="Filter by Name:" label-for="FilterName">
            <BFormInput
              id="FilterName"
              v-model="filters.name"
              placeholder="Enter recipe name"
            ></BFormInput>
          </BFormGroup>
        </BCol>
        <BCol md="4">
          <BFormGroup label="Filter by Tags:" label-for="FilterTags">
            <BFormSelect
              id="FilterTags"
              v-model="filters.tag"
              :options="recipeTagOptions"
            ></BFormSelect>
          </BFormGroup>
        </BCol>
        <BCol md="4">
          <BFormGroup
            label="Filter by Difficulty:"
            label-for="FilterDifficulty"
          >
            <BFormSelect
              id="FilterDifficulty"
              v-model="filters.difficulty"
              :options="[
                {
                  text: 'Select difficulty',
                  value: ''
                },
                ...recipeDifficulty
              ]"
            ></BFormSelect>
          </BFormGroup>
        </BCol>
      </BRow>
      <BRow class="mb-3 align-items-center">
        <!-- Sort By -->
        <BCol md="4">
          <BFormGroup label="Sort By:" label-for="SortBy">
            <BInputGroup>
              <BFormSelect
                id="SortBy"
                v-model="sortBy"
                :options="sortByOptions"
              >
              </BFormSelect>
              <template #append>
                <BButton size="sm" @click="toggleSortOrder">
                  <ArrowUpIcon v-if="sortOrder === 'asc'" />
                  <ArrowDownIcon v-else />
                </BButton>
              </template>
            </BInputGroup>
          </BFormGroup>
        </BCol>
        <!-- <BCol md="4" class="d-flex justify-content-end">
          <BButton
            class="w-100"
            variant="outline-secondary"
            @click="toggleMode"
          >
            <TableIcon v-if="!isTableMode" />
            <GridIcon v-else />
          </BButton>
        </BCol> -->
      </BRow>
    </div>
    <BRow class="mt-2">
      <BCol>
        <RecipesGrid v-if="!isTableMode" :recipes="computedRecipes" />
        <RecipesTable v-else :recipes="computedRecipes" />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
// import TableIcon from '~icons/bi/table'
// import GridIcon from '~icons/bi/grid'
import { recipeDifficulty, type Recipe } from '~/types/recipe'
import ArrowUpIcon from '~icons/bi/arrow-up'
import ArrowDownIcon from '~icons/bi/arrow-down'

const isTableMode = ref(false)
const toggleMode = () => {
  isTableMode.value = !isTableMode.value
}

const filters = ref({
  name: '',
  tag: '',
  difficulty: ''
})
const sortByOptions: { text: string; value: '' | keyof Recipe }[] = [
  { text: 'Sort By', value: '' },
  { text: 'Name', value: 'name' },
  { text: 'Created At', value: 'createdAt' },
  { text: 'Recently Updated', value: 'updatedAt' },
  { text: 'Time', value: 'time' }
]
const sortOrder = ref<'asc' | 'desc'>('asc')
const sortBy = ref<'' | keyof Recipe>('')
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const recipeTags = await useFetch('/api/recipe-tags')
const recipeTagOptions = computed(() => [
  { text: 'Select a tag', value: '' },
  recipeTags.data.value?.map((el) => ({ text: el, value: el }))
])

const recipes = await useFetch('/api/recipes')
const computedRecipes = computed(() => {
  let items = recipes.data.value || []
  if (filters.value.name) {
    items = items.filter((el) =>
      el.name.toLowerCase().includes(filters.value.name.toLowerCase())
    )
  }
  if (filters.value.tag) {
    items = items.filter((el) =>
      el.tags.some((tag) =>
        tag.text.toLowerCase().includes(filters.value.tag.toLowerCase())
      )
    )
  }
  if (filters.value.difficulty) {
    items = items.filter((el) => el.difficulty === filters.value.difficulty)
  }
  if (sortBy.value) {
    items = items.toSorted((a, b) => {
      if (!sortBy.value) return 0
      const valueA = a[sortBy.value]
      const valueB = b[sortBy.value]
      if (typeof valueA === 'number' && typeof valueB === 'number')
        return valueA - valueB
      if (typeof valueA === 'string' && typeof valueB === 'string')
        return valueA.localeCompare(valueB)
      return 0
    })
  }
  return items
})
</script>
