import { InputField } from '@segment/actions-core/index'
import { productsFields } from './productsFields'

export const collectionFields: Record<string, InputField> = {
  collection: {
    label: 'Collection',
    type: 'object',
    description: 'Collection details',
    additionalProperties: false,
    properties: {
      id: {
        label: 'Collection Id',
        type: 'string',
        description: 'A globally unique identifier for the collection.'
      },
      title: {
        label: 'Title',
        type: 'string',
        description: 'The collection title.'
      }
    },
    default: {
      id: {
        '@path': '$.properties.list_id'
      },
      title: {
        '@path': '$.properties.list_name'
      }
    }
  },
  collectionProductVariants: {
    ...productsFields,
    label: 'Collection Product Variants',
    description: 'A list of product variants associated with the collection.'
  }
}
