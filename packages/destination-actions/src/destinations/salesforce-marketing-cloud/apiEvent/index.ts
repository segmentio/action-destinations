import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { eventDefinitionKey, contactKeyAPIEvent, eventData } from '../sfmc-properties'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send API Event',
  description: 'Send events into an existing Event Definition in Salesforce Marketing Cloud.',
  fields: {
    eventDefinitionKey: eventDefinitionKey,
    contactKey: contactKeyAPIEvent,
    data: eventData
  },
  perform: (request, { settings, payload }) => {
    return request(`https://${settings.subdomain}.rest.marketingcloudapis.com/interaction/v1/events`, {
      method: 'POST',
      json: payload
    })
  }
}

export default action
