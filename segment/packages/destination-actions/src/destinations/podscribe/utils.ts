export const serializeParams = (params: any) => {
  return Object.entries(params)
    .reduce((acc, [k, v]: any[]) => {
      if (Array.isArray(v)) {
        for (const val of v) {
          acc.append(k, val)
        }
        return acc
      }
      if (v) {
        acc.append(k, v)
      }
      return acc
    }, new URLSearchParams())
    .toString()
}
