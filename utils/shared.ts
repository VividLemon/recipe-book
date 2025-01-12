export const maximumRecipeStepsPhotoDimensions = {
  width: 100,
  height: 100
} as const

export const stringBooleanToBoolean = (str: 'true' | 'false') => str === 'true'
