import type { Recipe } from '../../../types/recipe'
import { useRecipeStorage } from '../../utils/mongo'

export default defineEventHandler(async () => {
  const storage = useRecipeStorage()
  const keys = await storage.getKeys()
  return (await Promise.all(keys.map((el) => storage.getItem(el)))) as Recipe[]
})
