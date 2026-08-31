<template>
  <div class="border-bottom border-1 pb-2">
    <BRow no-gutters> Ingredient: {{ ingredient.name }} </BRow>
    <BRow>
      <BCol md="6" cols="12">
        <BFormGroup label="Quantity:">
          <BFormInput
            :model-value="quantity.value.value"
            :state="validateStateError(quantity.meta)"
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
            :model-value="ingredient.unit"
            :state="validateStateError(unit.meta)"
            :options="ingredientUnitsWeb as readonly string[]"
            @update:model-value="
              (e) => {
                ingredient = { ...ingredient, unit: String(e) as IngredientWeb['unit'] }
              }
            "
          />
        </BFormGroup>
      </BCol>
    </BRow>
  </div>
</template>

<script setup lang="ts">
import { ingredientUnitsWeb, type IngredientWeb } from '../../../types/recipe'
import {number, string} from "zod";

const props = defineProps<{
  name: string
}>()

const ingredient = defineModel<IngredientWeb>({
  required: true
})

const quantity = useField(
    () => `${props.name}.quantity`,
    toTypedSchema(number().min(0)),
        {initialValue: toRef(() => ingredient.value.quantity)})

const unit = useField(
    () => `${props.name}.unit`,
    toTypedSchema(string().nonempty()),
    {initialValue: toRef(() => ingredient.value.unit)})

</script>
