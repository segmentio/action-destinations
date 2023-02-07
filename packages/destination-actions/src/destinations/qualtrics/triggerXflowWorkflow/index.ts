import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger workflow in xflow',
  description: 'This action triggers a workflow in Qualtrics xflow',
  fields: {
    workflowUrl: {
      label: 'Workflow URL',
      type: 'string',
      format: 'uri',
      description:
        'Enter the full URL as you see in your Xflow trigger. [See more details on setting up an xflow trigger and getting the URL.](https://static-assets.qualtrics.com/static/integrations-external/twilio_segment_event_webhook_setup_instructions.pdf)',
      required: true
    },
    eventPayload: {
      label: 'Event payload',
      type: 'object',
      description: 'A mapping of key values to send to Qualtrics xflow.',
      defaultObjectUI: 'keyvalue',
      default: {
        event: {
          '@path': '$.event'
        },
        type: {
          '@path': '$.type'
        },
        userId: {
          '@path': '$.userId'
        },
        properties: {
          '@path': '$.properties'
        },
        traits: {
          '@path': '$.traits'
        },
        context: {
          '@path': '$.context'
        }
      }
    }
  },
  perform: (request, data) => {
    return request(data.payload.workflowUrl, {
      method: 'POST',
      json: data.payload.eventPayload,
      headers: {
        'X-API-TOKEN': data.settings.apiToken,
        'content-type': 'application/json'
      }
    })
  }
}

export default action
