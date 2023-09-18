import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { contactKey } from '../sfmc-properties'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Contact',
  description: 'Create contacts in Salesforce Marketing Cloud.',
  defaultSubscription: 'type = "identify"',
  fields: {
    contactKey: { ...contactKey, required: true }
  },
  perform: (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:create-contact`])
    return request(`https://${settings.subdomain}.rest.marketingcloudapis.com/contacts/v1/contacts`, {
      method: 'POST',
      json: {
        contactKey: payload.contactKey,
        attributeSets: []
      }
    })
  }
}

export default action
