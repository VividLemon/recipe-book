<template>
  <BContainer>
    <BRow>
      <BCol> Recipes </BCol>
    </BRow>
    <BRow class="mb-3 align-items-center">
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Name:" label-for="FilterName">
          <BFormInput
            id="FilterName"
            v-model="filters.name"
            placeholder="Enter recipe name"
          ></BFormInput>
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Tags:" label-for="FilterTags">
          <BFormSelect
            id="FilterTags"
            v-model="filters.tag"
            :options="recipeTagOptions"
          ></BFormSelect>
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Difficulty:" label-for="FilterDifficulty">
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
      <!-- Sort By -->
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Sort By:" label-for="SortBy">
          <BInputGroup>
            <BFormSelect id="SortBy" v-model="sortBy" :options="sortByOptions">
            </BFormSelect>
            <template #append>
              <BButton
                variant="outline-secondary"
                size="sm"
                @click="toggleSortOrder"
              >
                <ArrowUpIcon v-if="sortOrder === 'asc'" />
                <ArrowDownIcon v-else />
              </BButton>
            </template>
          </BInputGroup>
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Table Mode:">
          <BFormSelect v-model="tableMode" :options="tableModes" />
        </BFormGroup>
      </BCol>
      <BCol v-show="tableMode === 'Grid'" lg="4" md="6" cols="12">
        <BFormGroup label="Grid Per Row:">
          <BFormSelect
            v-model="gridPerRow"
            :options="[{ text: 'Auto', value: 'auto' }, 5, 4, 3, 2, 1]"
          />
        </BFormGroup>
      </BCol>
    </BRow>
    <BRow class="mt-2">
      <BCol>
        <template
          v-if="
            recipes.status.value === 'success' && recipes.data.value?.length
          "
        >
          <RecipesGrid
            v-if="tableMode === 'Grid'"
            :per-row="gridPerRow"
            :recipes="computedRecipes"
            @open-recipe="onOpenRecipe"
          />
          <RecipesTable
            v-else
            :recipes="computedRecipes"
            @open-recipe="onOpenRecipe"
          />
          <RecipesShowRecipeModal
            v-model="openRecipe"
            :recipe="currentRecipe"
            @hidden="currentRecipe = null"
          />
        </template>
        <BAlert
          v-else-if="recipes.status.value === 'error'"
          :model-value="true"
          variant="warning"
        >
          {{ recipes.error.value }}
        </BAlert>
        <BAlert v-else :model-value="true" variant="info"
          >No recipes have been made! Make one
          <BLink to="/recipes/create">Here</BLink>
        </BAlert>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
// import TableIcon from '~icons/bi/table'
// import GridIcon from '~icons/bi/grid'
import {
  recipeDifficulty,
  type ReadRecipeResponse,
  type Recipe
} from '~/types/recipe'
import ArrowUpIcon from '~icons/bi/arrow-up'
import ArrowDownIcon from '~icons/bi/arrow-down'

const { isFavorite } = useFavoriteRecipe()

const tableModes = ['Grid', 'Table'] as const
const tableMode = ref<(typeof tableModes)[number]>('Grid')

const filters = ref({
  name: '',
  tag: '',
  difficulty: ''
})
type SortByValueOptions = '' | keyof Recipe | 'favorited'
const sortByOptions: {
  text: string
  value: SortByValueOptions
}[] = [
  { text: 'Sort By', value: '' },
  { text: 'Favorited', value: 'favorited' },
  { text: 'Name', value: 'name' },
  { text: 'Created At', value: 'createdAt' },
  { text: 'Recently Updated', value: 'updatedAt' },
  { text: 'Time', value: 'time' }
]
const sortOrder = ref<'asc' | 'desc'>('asc')
const sortBy = ref<SortByValueOptions>('')
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const gridPerRow = ref<number | 'auto'>('auto')

const recipeTags = await useFetch('/api/recipe-tags')
const recipeTagOptions = computed(() => [
  { text: 'Select a tag', value: '' },
  ...(recipeTags.data.value?.map((el) => ({ text: el.text, value: el.id })) ||
    [])
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
      el.tags.some((tag) => tag.id === filters.value.tag)
    )
  }
  if (filters.value.difficulty) {
    items = items.filter((el) => el.difficulty === filters.value.difficulty)
  }
  if (sortBy.value) {
    if (sortBy.value === 'favorited') {
      const favoritedItems = items.filter((el) => isFavorite(el.id))
      const nonFavoritedItems = items.filter((el) => !isFavorite(el.id))
      items =
        sortOrder.value === 'asc'
          ? [...favoritedItems, ...nonFavoritedItems]
          : [...nonFavoritedItems, ...favoritedItems]
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items = items.toSorted((a: any, b: any) => {
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
  }
  return items
})

const openRecipe = ref(false)
const currentRecipe = ref<ReadRecipeResponse[number] | null>(null)
const onOpenRecipe = (id: string) => {
  currentRecipe.value = recipes.data.value?.find((el) => el.id === id) || null
  if (currentRecipe.value) {
    openRecipe.value = true
  }
}

const route = useRoute()
if (typeof route.query.openRecipe === 'string') {
  onOpenRecipe(route.query.openRecipe)
}
</script>
