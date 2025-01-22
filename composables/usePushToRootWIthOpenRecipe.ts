export const usePushToRootWithOpenRecipe = () => {
  const router = useRouter()

  const execute = (id: string) =>
    router.push({
      path: '/',
      query: {
        openRecipe: id
      }
    })

  return { execute }
}
