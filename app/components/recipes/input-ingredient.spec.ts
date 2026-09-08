import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InputIngredient from './InputIngredient.vue'

describe('InputIngredient', () => {
  it('renders the ingredient name and editable controls', () => {
    const wrapper = mount(InputIngredient, {
      props: {
        name: 'ingredients[0]',
        modelValue: { name: 'Flour', quantity: 2, unit: 'cup' }
      }
    })

    expect(wrapper.text()).toContain('Ingredient: Flour')
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
  })
})
