import type { Recipe } from '../../../types/recipe'
import { useRecipeStorage } from '../../utils/mongo'

export default defineEventHandler(async () => {
  const storage = useRecipeStorage()
  const keys = await storage.getKeys()
  const items = (await storage.getItems(keys)) as unknown as Recipe[]
  return items
})
