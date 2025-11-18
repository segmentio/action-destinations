import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { contactKey } from '../sfmc-properties'
import type { Payload } from './generated-types'
import { SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION } from '../../versioning-info'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Contact',
  description: 'Create contacts in Salesforce Marketing Cloud.',
  defaultSubscription: 'type = "identify"',
  fields: {
    contactKey: { ...contactKey, required: true }
  },
  perform: (request, { settings, payload }) => {
    return request(
      `https://${settings.subdomain}.rest.marketingcloudapis.com/contacts/${SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION}/contacts`,
      {
        method: 'POST',
        json: {
          contactKey: payload.contactKey,
          attributeSets: []
        }
      }
    )
  }
}

export default action
