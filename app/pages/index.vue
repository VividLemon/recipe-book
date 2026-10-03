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
            :model-value="query.name"
            @update:model-value="update({ name: String($event ?? '') }, { replace: true })"
            placeholder="Enter recipe name"
          />
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Tags:" label-for="FilterTags">
          <BFormSelect
            id="FilterTags"
            :model-value="query.tag"
            @update:model-value="update({ tag: String($event ?? '') })"
            :options="recipeTagOptions"
          />
        </BFormGroup>
      </BCol>
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Filter by Difficulty:" label-for="FilterDifficulty">
          <BFormSelect
            id="FilterDifficulty"
            :model-value="query.difficulty"
            @update:model-value="update({ difficulty: $event as '' | RecipeDifficultyWeb })"
            :options="[
              {
                text: 'Select difficulty',
                value: ''
              },
              ...recipeDifficultyWeb
            ]"
          />
        </BFormGroup>
      </BCol>
      <!-- Sort By -->
      <BCol lg="4" md="6" cols="12">
        <BFormGroup label="Sort By:" label-for="SortBy">
          <BInputGroup>
            <BFormSelect
              id="SortBy"
              :model-value="query.sortBy"
              :options="sortByOptions"
              @update:model-value="update({ sortBy: $event as RecipeListSortBy })"
            />
            <template #append>
              <BButton
                variant="outline-secondary"
                size="sm"
                aria-label="Toggle Sort Order"
                @click="toggleSortOrder"
              >
                <component
                  :is="query.sortOrder === 'asc' ? ArrowUpIcon : ArrowDownIcon"
                />
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
          v-if="recipes.items.value.length"
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
          <div ref="sentinel" class="text-center my-3">
            <BButton
              v-if="recipes.hasNextPage.value"
              variant="outline-primary"
              :disabled="recipes.asyncStatus.value === 'loading'"
              @click="recipes.loadNextPage()"
            >
              {{ recipes.asyncStatus.value === 'loading' ? 'Loading...' : 'Load more' }}
            </BButton>
          </div>
        </template>
        <BAlert
          v-else-if="recipes.status.value === 'error'"
          :model-value="true"
          variant="warning"
        >
          {{ recipes.error.value }}
        </BAlert>
        <BAlert
          v-else-if="recipes.asyncStatus.value === 'loading'"
          :model-value="true"
          variant="info"
        >
          Loading recipes...
        </BAlert>
        <BAlert v-else :model-value="true" variant="info"
          >No recipes have been made! Make one
          <BLink to="/recipes/create">here</BLink>
        </BAlert>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import {
  recipeDifficultyWeb,
  type RecipeDifficultyWeb,
  type RecipeWeb
} from '../../types/recipe'
import ArrowUpIcon from '~icons/bi/arrow-up'
import ArrowDownIcon from '~icons/bi/arrow-down'
import type { RecipeListSortBy } from '~/utils/recipeQuery'

const { loggedIn } = useUserSession()

const tableModes = ['Grid', 'Table'] as const
const tableMode = useLocalStorage<(typeof tableModes)[number]>(
  'recipe-table-mod',
  'Grid',
  {
    initOnMounted: true
  }
)

const { query, update } = useRecipeListRoute()
watch([loggedIn, () => query.value.sortBy], ([isLoggedIn, sortBy]) => {
  if (!isLoggedIn && sortBy === 'favorite') {
    update({ sortBy: '' }, { replace: true })
    navigateTo('/login')
  }
})

const sortByOptions = computed<{
  text: string
  value: RecipeListSortBy
  disabled?: boolean
}[]>(() => [
  { text: 'Sort By', value: '' },
  { text: 'Favorite', value: 'favorite', disabled: !loggedIn.value },
  { text: 'Name', value: 'name' },
  { text: 'Created At', value: 'createdAt' },
  { text: 'Recently Updated', value: 'updatedAt' },
  { text: 'Time', value: 'time' }
] as const)
const toggleSortOrder = () => {
  update({ sortOrder: query.value.sortOrder === 'asc' ? 'desc' : 'asc' })
}

const gridPerRow = ref<number | 'auto'>('auto')

const recipeTags = await useFetch('/api/recipe-tags')
const recipeTagOptions = computed(() => [
  { text: 'Select a tag', value: '' },
  ...(recipeTags.data.value?.map((el) => ({ text: el.text, value: el.id })) ||
    [])
])

const recipes = useRecipeList(query)
const requestFetch = useRequestFetch()

const computedRecipes = computed<RecipeWeb[]>(() => recipes.items.value)

const sentinel = useTemplateRef<HTMLElement>('sentinel')
useIntersectionObserver(sentinel, ([entry]) => {
  if (
    entry?.isIntersecting
    && recipes.hasNextPage.value
    && recipes.asyncStatus.value !== 'loading'
  ) {
    recipes.loadNextPage()
  }
})

const openRecipe = ref(false)
const currentRecipe = ref<RecipeWeb | null>(null)
const onOpenRecipe = async (id: string) => {
  currentRecipe.value =
    recipes.items.value.find((el) => el.id === id)
    || (await requestFetch(`/api/recipes/${id}`).catch(() => null))
  if (currentRecipe.value) {
    openRecipe.value = true
  }
}

const route = useRoute()
if (typeof route.query.openRecipe === 'string') {
  await onOpenRecipe(route.query.openRecipe)
}
</script>
