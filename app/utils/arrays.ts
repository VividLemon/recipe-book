export const chunkArray = <T>(inputArray: T[], chunkSize: number): T[][] => {
  const result: T[][] = []
  chunkSize = chunkSize <= 0 ? 1 : chunkSize
  for (let i = 0; i < inputArray.length; i += chunkSize) {
    result.push(inputArray.slice(i, i + chunkSize))
  }
  return result
}
