import type { ActionDefinition, DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import type { InputField } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AttioClient } from '../api'

const object: InputField = {
  type: 'string',
  label: 'Attio Object',
  description: "The type of Attio Object you'd like to create or update ('assert')",
  dynamic: true,
  required: true,
  default: 'person'
}

const matching_attribute: InputField = {
  type: 'string',
  label: 'Matching Attribute',
  description:
    'The Attribute (ID or slug) on the Attio Object above, that uniquely identifies a Record (and is marked as unique in Attio). ' +
    'Events containing the same value for this attribute will update the original Record, rather than creating a new one. ' +
    'For example, to create or update a Person you might use the Attio attribute `email_addresses` here.',
  required: true,
  default: 'email_addresses'
}

const attributes: InputField = {
  type: 'object',
  label: 'Attributes',
  description:
    'Attributes to either set or update on the Attio Record. The keys on the left should be ' +
    'Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text. ' +
    'The Matching Attribute must be included for assertion to work.',
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: true,
  properties: {
    name: {
      label: 'Name',
      type: 'string'
    }
  },
  default: {
    name: { '@path': '$.traits.name' }
  }
}

export const objectLookup = async (request: RequestClient): Promise<DynamicFieldResponse> => {
  try {
    const objects = await new AttioClient(request).listObjects()

    return {
      choices: objects.map(({ api_slug, singular_noun }) => ({
        value: api_slug,
        label: singular_noun
      }))
    }
  } catch (error: any) {
    const response_data = error?.response?.data ?? {}

    return {
      choices: [],
      error: {
        code: response_data.status_code ? String(response_data.status_code) : 'unknown',
        message: (response_data.message as string) ?? error?.message ?? 'Unknown error'
      }
    }
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Assert Record',
  description: 'Create or update a Record in Attio.',

  fields: {
    object,
    matching_attribute,
    attributes
  },

  dynamicFields: {
    object: objectLookup
  },

  perform: async (request, data) => {
    const {
      payload: { attributes, object, matching_attribute }
    } = data

    const client = new AttioClient(request)

    return await client.assertRecord({
      object,
      matching_attribute,
      values: attributes ?? {}
    })
  }
}

export default action
