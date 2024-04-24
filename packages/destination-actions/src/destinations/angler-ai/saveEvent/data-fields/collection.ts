import { InputField } from '@segment/actions-core/index'

export const collection: InputField = {
  type: 'object',
  label: 'Collection',
  description: '',
  properties: {
    id: {
      type: 'string',
      label: 'Collection ID',
      description: 'A globally unique identifier.'
    },
    title: {
      type: 'string',
      label: 'Collection Title',
      description: "The collection's name."
    }
  }
}

export const collectionDefault = {
  id: { '@path': '$.properties.collection.id' },
  title: { '@path': '$.properties.collection.title' }
}
