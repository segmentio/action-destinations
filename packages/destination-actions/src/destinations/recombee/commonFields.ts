import { InputField } from '@segment/actions-core'

export const userIdField = (
  description: string,
  fieldProps: Partial<Omit<InputField, 'description'>> = {}
): InputField => ({
  label: 'User ID',
  description,
  type: 'string',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.userId' },
      then: { '@path': '$.userId' },
      else: { '@path': '$.anonymousId' }
    }
  },
  ...fieldProps
})

export const itemIdField = (
  description: string,
  fieldProps: Partial<Omit<InputField, 'description'>> = {}
): InputField => ({
  label: 'Item ID',
  description,
  type: 'string',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.properties.product_id' },
      then: { '@path': '$.properties.product_id' },
      else: { '@path': '$.properties.asset_id' }
    }
  },
  ...fieldProps
})

export const interactionTimestampField: (interactionName: string, fieldProps?: Partial<InputField>) => InputField = (
  interactionName,
  fieldProps = {}
) => ({
  label: 'Timestamp',
  description: `The UTC timestamp of when the ${interactionName} occurred, in Unix seconds, Unix milliseconds, or ISO-8601 format. When recording interactions you plan to later delete by exact timestamp — whether via this destination or the Recombee API directly — avoid mapping the root \`timestamp\` here, as it may be corrected for clock skew. Use \`properties.timestamp\` instead.`,
  type: 'datetime',
  required: false,
  default: {
    '@if': {
      exists: { '@path': '$.properties.timestamp' },
      then: { '@path': '$.properties.timestamp' },
      else: { '@path': '$.timestamp' }
    }
  },
  ...fieldProps
})

export const deleteTimestampField: (interactionName: string, fieldProps?: Partial<InputField>) => InputField = (
  interactionName,
  fieldProps = {}
) => ({
  label: 'Timestamp',
  description: `The UTC timestamp of the ${interactionName} to delete, in Unix seconds, Unix milliseconds, or ISO-8601 format. Must match the timestamp used in the ${interactionName} to be deleted. If omitted, all ${interactionName}s for the given \`userId\` and \`itemId\` are deleted.`,
  type: 'datetime',
  required: false,
  default: { '@path': '$.properties.timestamp' },
  ...fieldProps
})

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
