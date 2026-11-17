import { CATEGORIES } from './categories'
import { MAX_CATEGORY_RESULTS } from './constants'

const CATEGORY_LABELS = CATEGORIES.map(([id, path]) => `${id} (${path})`)
const LOWERCASE_CATEGORY_LABELS = CATEGORY_LABELS.map((label) => label.toLowerCase())
const TOP_LEVEL_CATEGORY_LABELS = CATEGORIES.flatMap(([, path], index) =>
  path.includes('>') ? [] : [CATEGORY_LABELS[index]]
)

export function searchCategories(query?: string) {
  const text = query?.trim().toLowerCase()
  const labels: string[] = []

  if (!text) {
    labels.push(...TOP_LEVEL_CATEGORY_LABELS.slice(0, MAX_CATEGORY_RESULTS))
  } else {
    for (let i = 0; i < CATEGORY_LABELS.length && labels.length < MAX_CATEGORY_RESULTS; i++) {
      if (LOWERCASE_CATEGORY_LABELS[i].includes(text)) {
        labels.push(CATEGORY_LABELS[i])
      }
    }
  }

  return labels.map((label) => ({ label, value: label }))
}
