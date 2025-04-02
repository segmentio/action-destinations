import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update User Profile',
  description: 'Update or create a profile with attributes in Batch',
  fields: {
    identifiers: {
      label: 'Identifiers',
      description: "Identifiant(s) de l'utilisateur",
      type: 'object',
      properties: {
        custom_id: {
          label: 'User ID',
          description: 'The unique profile identifier',
          type: 'string',
          required: true,
          default: {
            '@path': '$.userId'
          }
        }
      }
    },
    attributes: {
      label: 'Attributes',
      description: 'Profile data',
      type: 'object',
      properties: {
        $email_address: {
          label: 'Email',
          description: "The profile's email",
          type: 'string',
          allowNull: true,
          default: {
            '@path': '$.traits.email'
          }
        },
        $email_marketing: {
          label: 'Email marketing subscribe',
          description:
            "The profile's marketing emails subscription. You can set it to subscribed , unsubscribed , or null to reset the marketing emails subscription.",
          type: 'string',
          allowNull: true
        },
        $phone_number: {
          label: 'Phone Number',
          description: "The profile's phone number",
          type: 'string',
          allowNull: true,
          default: {
            '@path': '$.traits.phone_number'
          }
        },
        $sms_marketing: {
          label: 'SMS marketing subscribe',
          description:
            "The profile's marketing SMS subscription. You can set it to subscribed , unsubscribed , or null to reset the marketing SMS subscription.",
          type: 'string',
          allowNull: true
        },
        $language: {
          label: 'Language',
          description: "The profile's language.",
          type: 'string',
          allowNull: true,
          default: {
            '@path': '$.traits.language'
          }
        },
        $region: {
          label: 'Region',
          description: "The profile's region",
          type: 'string',
          allowNull: true,
          default: {
            '@path': '$.context.location.country'
          }
        },
        $timezone: {
          label: 'Timezone',
          description:
            'The profile’s time zone name from IANA Time Zone Database  (e.g., “Europe/Paris”). Only valid time zone values will be set.',
          type: 'string',
          allowNull: true,
          default: {
            '@path': '$.context.timezone'
          }
        },
        properties: {
          label: 'Custom attributes',
          description: 'The profile’s custom attributes ',
          type: 'object',
          default: {
            '@path': '$.properties'
          }
        },
        batch_size: {
          label: 'Batch Size',
          description: 'Maximum number of attributes to include in each batch.',
          type: 'number',
          default: 50,
          unsafe_hidden: true
        }
      }
    }
  },
  perform: (request, data) => {
    const newPayload = buildProfileJson(data.payload)
    console.dir(newPayload, { depth: null }) // log the resolved payload after mappings

    return request('https://api.batch.com/2.2/profiles/update', {
      method: 'post',
      json: newPayload
    })
  },
  performBatch: (request, data) => {
    console.dir(data.payload, { depth: null }) // log the resolved payload after mappings

    return request('https://api.batch.com/2.2/profiles/update', {
      method: 'post',
      json: data.payload
    })
  }
}

function buildProfileJson(data: Payload): Payload[] {
  // Retrieve the batch size dynamically or default to 50
  const batchSize = data.attributes?.batch_size || 50

  // Extract identifiers
  const identifiers = {
    custom_id: data.identifiers?.custom_id || '' // Unique identifier
  }

  // Extract standard attributes
  const attributes = {
    $email_address: data.attributes?.$email_address || null,
    $email_marketing: data.attributes?.$email_marketing || null,
    $phone_number: data.attributes?.$phone_number || null,
    $sms_marketing: data.attributes?.$sms_marketing || null,
    $language: data.attributes?.$language || null,
    $region: data.attributes?.$region || null,
    $timezone: data.attributes?.$timezone || null
  }

  // Extract custom properties with batch size limitation
  const customProperties = data.attributes?.properties || {}
  Object.keys(attributes).forEach((key) => {
    delete customProperties[key]
  })

  const limitedProperties = Object.keys(customProperties)
    .slice(0, batchSize) // Limit the size to batchSize
    .reduce((obj: Record<string, any>, key: string) => {
      const value = customProperties[key]
      // Check if the value is an ISO 8601 date and add 'date()' prefix to the key
      if (isISO8601Date(value as string)) {
        console.dir('value date = ' + value, { depth: null })
        obj[`date(${key})`] = value
      }
      // Check if the value is a valid URL and add 'url()' prefix to the key
      else if (isValidUrl(value as string)) {
        console.dir('value url = ' + value, { depth: null })
        obj[`url(${key})`] = value
      } else {
        obj[key] = value
      }

      return obj
    }, {})

  // Merge standard attributes and custom properties
  const fullAttributes = { ...attributes, ...limitedProperties }

  // Wrap the output in an array
  return [
    {
      identifiers: identifiers,
      attributes: fullAttributes
    }
  ]
}

// Utility function to check if a string is in ISO 8601 date format
function isISO8601Date(value: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3,6})?Z$/
  return typeof value === 'string' && iso8601Regex.test(value)
}

// Utility function to check if a string is a valid URL
function isValidUrl(value: string): boolean {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return typeof value === 'string' && urlRegex.test(value)
}

export default action
