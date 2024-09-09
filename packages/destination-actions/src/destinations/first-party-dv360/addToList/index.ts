import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { emails, phoneNumbers, zipCodes, firstName, lastName, countryCode } from '../properties'
import { addCustomerMatchMembers } from '../functions'

const action: ActionDefinition<AudienceSettings, Payload> = {
  title: 'Edit Customer Match Members',
  description: 'Add or update customer match members in Google Display & Video 360.',
  defaultSubscription: 'event = "Audeince Entered"',
  fields: {
    emails: { ...emails },
    phoneNumbers: { ...phoneNumbers },
    zipCodes: { ...zipCodes },
    firstName: { ...firstName },
    lastName: { ...lastName },
    countryCode: { ...countryCode }
  },
  perform: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers', 1, statsContext?.tags)
    return addCustomerMatchMembers(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers.batch', 1, statsContext?.tags)
    console.log('Pre-Payload', payload)
    return addCustomerMatchMembers(request, settings, payload)
  }
}

export default action
