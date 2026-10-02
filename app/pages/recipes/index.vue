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
            v-model="name"
            maxlength="100"
            placeholder="Enter recipe name"
          />
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Tags:" label-for="FilterTags">
          <BFormSelect
            id="FilterTags"
            v-model="tagId"
            :options="recipeTagOptions"
          />
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Difficulty:" label-for="FilterDifficulty">
          <BFormSelect
            id="FilterDifficulty"
            v-model="difficulty"
            :options="[
              { text: 'Select difficulty', value: '' },
              ...recipeDifficultyWeb
            ]"
          />
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Sort By:" label-for="SortBy">
          <BInputGroup>
            <BFormSelect id="SortBy" v-model="sortField" :options="sortByOptions" />
            <template #append>
              <BButton
                variant="outline-secondary"
                size="sm"
                aria-label="Toggle Sort Order"
                @click="toggleSortOrder"
              >
                <component :is="sortDirection === 'asc' ? ArrowUpIcon : ArrowDownIcon" />
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
        <BAlert
          v-if="state.status === 'error' && !recipes.length"
          :model-value="true"
          variant="warning"
        >
          {{ error }}
        </BAlert>
        <BAlert
          v-else-if="state.status === 'pending' && !recipes.length"
          :model-value="true"
          variant="info"
        >
          Loading recipes…
        </BAlert>
        <BAlert
          v-else-if="state.status === 'success' && !recipes.length"
          :model-value="true"
          variant="info"
        >
          No recipes found. Make one <BLink to="/recipes/create">here</BLink>
        </BAlert>
        <template v-else>
          <BAlert
            v-if="state.status === 'error'"
            :model-value="true"
            variant="warning"
          >
            {{ error }}
          </BAlert>
          <RecipesGrid
            v-if="tableMode === 'Grid'"
            :per-row="gridPerRow"
            :recipes="displayedRecipes"
            @open-recipe="onOpenRecipe"
          />
          <RecipesTable
            v-else
            :recipes="displayedRecipes"
            @open-recipe="onOpenRecipe"
          />
          <div class="d-flex flex-column align-items-center gap-2 my-3">
            <span>{{ recipes.length }} of {{ total }} recipes</span>
            <div v-if="canLoadMore" ref="loadMoreTrigger">
              <BButton
                variant="outline-primary"
                :disabled="asyncStatus === 'loading'"
                @click="loadMore({ push: true })"
              >
                {{ asyncStatus === 'loading' ? 'Loading…' : 'Load more' }}
              </BButton>
            </div>
          </div>
          <RecipesShowRecipeModal
            v-model="openRecipe"
            :recipe="currentRecipe"
            @hidden="currentRecipe = null"
          />
        </template>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { useTemplateRef } from 'vue'
import {
  recipeDifficultyWeb,
  type RecipeListSortField,
  type RecipeWeb
} from '../../../types/recipe'
import ArrowUpIcon from '~icons/bi/arrow-up'
import ArrowDownIcon from '~icons/bi/arrow-down'

const recipesQuery = useRecipeList()
const {
  name,
  tagId,
  difficulty,
  sortField,
  sortDirection,
  state,
  error,
  asyncStatus,
  canLoadMore,
  loadMore,
  recipes,
  total
} = recipesQuery
const { hasFavorite } = useFavoriteRecipe()

const tableModes = ['Grid', 'Table'] as const
const tableMode = useLocalStorage<(typeof tableModes)[number]>(
  'recipe-table-mod',
  'Grid',
  { initOnMounted: true }
)
const sortByOptions: {
  text: string
  value: RecipeListSortField | ''
}[] = [
  { text: 'Sort By', value: '' },
  { text: 'Favorite', value: 'favorite' },
  { text: 'Name', value: 'name' },
  { text: 'Created At', value: 'createdAt' },
  { text: 'Recently Updated', value: 'updatedAt' },
  { text: 'Time', value: 'time' }
]
const toggleSortOrder = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}
const gridPerRow = ref<number | 'auto'>('auto')

const recipeTags = await useFetch('/api/recipe-tags')
const recipeTagOptions = computed(() => [
  { text: 'Select a tag', value: '' },
  ...(recipeTags.data.value?.map((tag) => ({ text: tag.text, value: tag.id })) ??
    [])
])

const displayedRecipes = computed(() => {
  if (sortField.value !== 'favorite') return recipes.value
  return [...recipes.value].sort((left, right) => {
    const leftFavorite = hasFavorite(left.id)
    const rightFavorite = hasFavorite(right.id)
    if (leftFavorite === rightFavorite) return 0
    const favoritesFirst = sortDirection.value === 'asc'
    return leftFavorite === favoritesFirst ? -1 : 1
  })
})

const loadMoreTrigger = useTemplateRef<HTMLElement>('loadMoreTrigger')
useInfiniteScroll(loadMoreTrigger, loadMore, {
  distance: 150,
  canLoadMore: () =>
    canLoadMore.value && asyncStatus.value !== 'loading'
})

const openRecipe = ref(false)
const currentRecipe = ref<RecipeWeb | null>(null)
const onOpenRecipe = (id: string) => {
  currentRecipe.value = recipes.value.find((recipe) => recipe.id === id) ?? null
  if (currentRecipe.value) openRecipe.value = true
}

const route = useRoute()
if (typeof route.query.openRecipe === 'string') {
  onOpenRecipe(route.query.openRecipe)
}
</script>
