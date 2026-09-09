import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipesGrid from './RecipesGrid.vue'

describe('RecipesGrid', () => {
  it('renders recipe cards and emits the selected recipe id', async () => {
    const recipes = [{
      id: 'recipe-1',
      createdAt: 0,
      updatedAt: 0,
      name: 'Soup',
      ingredients: [],
      tags: [],
      steps: 'Boil',
      difficulty: 'Easy' as const,
      time: 60
    }]
    const wrapper = mount(RecipesGrid, {
      props: { recipes, perRow: 1 },
      global: {
        stubs: {
          RecipesFavoriteStarIcon: true,
          BCard: { props: ['title'], template: '<div><slot name="footer" /><span>{{ title }}</span></div>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Soup')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('open-recipe')?.[0]).toEqual(['recipe-1'])
  })
})
