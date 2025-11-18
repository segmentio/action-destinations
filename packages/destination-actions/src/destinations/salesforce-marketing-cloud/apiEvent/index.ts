import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { eventDefinitionKey, contactKeyAPIEvent, eventData } from '../sfmc-properties'
import type { Payload } from './generated-types'
import { SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION } from '../../versioning-info'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send API Event',
  description: 'Send events into an existing Event Definition in Salesforce Marketing Cloud.',
  fields: {
    eventDefinitionKey: eventDefinitionKey,
    contactKey: contactKeyAPIEvent,
    data: eventData
  },
  perform: (request, { settings, payload }) => {
    return request(
      `https://${settings.subdomain}.rest.marketingcloudapis.com/interaction/${SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION}/events`,
      {
        method: 'POST',
        json: payload
      }
    )
  }
}

export default action
