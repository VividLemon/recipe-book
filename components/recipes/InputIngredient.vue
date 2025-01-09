<template>
  <div class="border-bottom border-1 pb-2">
    <BRow no-gutters> Ingredient: {{ ingredient.name }} </BRow>
    <BRow>
      <BCol md="6" cols="12">
        <BFormGroup label="Quantity:">
          <BFormInput
            ref="input"
            :model-value="ingredient.quantity"
            :state="validateStateError(v$.ingredient.quantity)"
            type="number"
            @update:model-value="
              (e) => {
                ingredient = {
                  ...ingredient,
                  quantity: Number.parseFloat(e?.toString() ?? '0')
                }
              }
            "
          />
        </BFormGroup>
      </BCol>
      <BCol md="6" cols="12">
        <BFormGroup label="Unit:">
          <BFormSelect
            ref="select"
            :model-value="ingredient.unit"
            :state="validateStateError(v$.ingredient.unit)"
            :options="ingredientUnits"
            @update:model-value="
              (e) => {
                ingredient = { ...ingredient, unit: e }
              }
            "
          />
        </BFormGroup>
      </BCol>
    </BRow>
  </div>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import { required, minValue } from '@vuelidate/validators'
import { ingredientUnits, type Ingredient } from '~/types/recipe'

const ingredient = defineModel<Ingredient>({
  required: true
})

const input = useTemplateRef('input')
const select = useTemplateRef('select')

const v$ = useVuelidate(
  {
    ingredient: {
      quantity: {
        required,
        minValue: minValue(0)
      },
      unit: {
        required
      }
    }
  },
  { ingredient }
)
</script>
