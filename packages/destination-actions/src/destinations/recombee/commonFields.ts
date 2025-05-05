import { InputField } from '@segment/actions-core'

export function interactionFields(interactionName: string): Record<string, InputField> {
  return {
    recommId: {
      label: 'Recommendation ID',
      description: `The ID of the clicked recommendation (if the ${interactionName} is based on a recommendation request).`,
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.recomm_id'
      }
    },
    internalAdditionalData: {
      label: 'Internal Additional Data',
      description: `Internal additional data to be stored with the ${interactionName}.`,
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      readOnly: true,
      unsafe_hidden: true,
      default: {
        segmentEventType: {
          '@path': '$.type'
        },
        segmentEventName: {
          '@if': {
            exists: { '@path': '$.event' },
            then: { '@path': '$.event' },
            else: { '@path': '$.name' }
          }
        }
      }
    },
    additionalData: {
      label: 'Additional Data',
      description: `Additional data to be stored with the ${interactionName}. *Keep this field empty unless instructed by the Recombee Support team.*`,
      type: 'object',
      required: false,
      displayMode: 'collapsed',
      defaultObjectUI: 'keyvalue:only'
    }
  }
}

export const ecommerceIdMapping = {
  itemId: {
    '@if': {
      exists: { '@path': '$.properties.product_id' },
      then: { '@path': '$.properties.product_id' },
      else: { '@path': '$.properties.sku' }
    }
  }
}

export const videoIdMapping = {
  itemId: {
    '@if': {
      exists: { '@path': '$.properties.content_asset_id' },
      then: { '@path': '$.properties.content_asset_id' },
      else: { '@path': '$.properties.content_asset_ids[0]' }
    }
  }
}
