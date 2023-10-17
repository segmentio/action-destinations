import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Stream Conversion Event',
  description: 'Directly streams conversion events to a specific conversion rule.',
  fields: {},
  hooks: {
    'on-subscription-save': {
      label: 'Create a Conversion Rule',
      description: 'When saving this mapping, we will create a conversion rule in LinkedIn using the fields you provided.',
      fields: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the conversion rule.'
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the conversion rule.'
        },
        conversionType: {
          type: 'string',
          label: 'Conversion Type',
          description: 'The type of conversion rule.'
        }
      },
      performHook: async (request, { settings, payload }) => {
        // https://api.linkedin.com/rest/conversions
        /**
         * 
        "name": "Conversion API Segment 1",
        "account": "urn:li:sponsoredAccount:507525021",
        "conversionMethod": "CONVERSIONS_API",
        "postClickAttributionWindowSize": 30,
        "viewThroughAttributionWindowSize": 7,
        "attributionType": "LAST_TOUCH_BY_CAMPAIGN",
        "type": "LEAD"
         */
      }
    }
  },
  perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
