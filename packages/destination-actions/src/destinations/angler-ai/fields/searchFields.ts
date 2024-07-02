import { InputField } from '@segment/actions-core/index'
import { productsFields } from './productsFields'

export const searchFields: Record<string, InputField> = {
  searchResults: {
    ...productsFields,
    label: 'Search Results',
    description: 'Search results details'
  },
  query: {
    type: 'string',
    label: 'Search Query',
    description: 'The search query that was executed.',
    default: {
      '@path': '$.properties.query'
    }
  }
}
