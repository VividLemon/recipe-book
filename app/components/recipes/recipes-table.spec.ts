import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipesTable from './RecipesTable.vue'

describe('RecipesTable', () => {
  it('passes formatted recipes and fields to the table', () => {
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
    const wrapper = mount(RecipesTable, { props: { recipes } })
    const table = wrapper.findComponent({ name: 'BTable' })

    expect(table.props('items')).toEqual([{ ...recipes[0], time: '1 hour' }])
    expect(table.props('fields')).toEqual(['name', 'difficulty', 'time', 'Actions'])
  })
})
