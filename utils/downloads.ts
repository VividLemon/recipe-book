export const toJSONBlob = (
  data: Record<string, unknown>[],
  { human }: { human?: boolean } = {}
) =>
  new Blob([JSON.stringify(data, null, human ? 2 : undefined)], {
    type: 'application/json'
  })

export const toCSVBlob = (data: Record<string, unknown>[]) => {
  const headers = Object.keys(data[0])
  const content = [
    headers,
    ...data.map((row) => headers.map((header) => row[header]))
  ]
  const csvContent = content.map((row) => row.join(',')).join('\n')
  return new Blob([csvContent], { type: 'text/csv' })
}

export type LocalFileTypeDownload = 'csv' | 'json'

export const objectToBlobSerializers = {
  json: toJSONBlob,
  csv: toCSVBlob
} as const satisfies Record<LocalFileTypeDownload, unknown>

export const downloadByClick = ({
  filename,
  blob
}: {
  filename: string
  blob: Blob
}) => {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  a.remove()
}
