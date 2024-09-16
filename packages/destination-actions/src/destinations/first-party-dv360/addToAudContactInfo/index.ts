import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { emails, phoneNumbers, zipCodes, firstName, lastName, countryCode, external_id } from '../properties'
import { editContactInfo } from '../functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Edit Customer Match Members - Contact Info List',
  description: 'Add or update customer match members in Google Display & Video 360 Contact Info List Audience.',
  defaultSubscription: 'event = "Audeince Entered - ContactInfoList"',
  fields: {
    emails: { ...emails },
    phoneNumbers: { ...phoneNumbers },
    zipCodes: { ...zipCodes },
    firstName: { ...firstName },
    lastName: { ...lastName },
    countryCode: { ...countryCode },
    external_id: { ...external_id }
  },
  perform: async (request, { payload, statsContext, audienceSettings }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers', 1, statsContext?.tags)
    return editContactInfo(request, audienceSettings, [payload], 'add', statsContext)
  },
  performBatch: async (request, { payload, statsContext, audienceSettings }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers.batch', 1, statsContext?.tags)
    return editContactInfo(request, audienceSettings, payload, 'add', statsContext)
  }
}

export default action
