import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  emails,
  phoneNumbers,
  zipCodes,
  firstName,
  lastName,
  countryCode,
  external_id,
  advertiser_id,
  enable_batching,
  batch_size
} from '../properties'
import { editContactInfo } from '../functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Edit Customer Match Members - Contact Info List',
  description: 'Add or update customer match members in Google Display & Video 360 Contact Info List Audience.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    emails: { ...emails },
    phoneNumbers: { ...phoneNumbers },
    zipCodes: { ...zipCodes },
    firstName: { ...firstName },
    lastName: { ...lastName },
    countryCode: { ...countryCode },
    external_id: { ...external_id },
    advertiser_id: { ...advertiser_id },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size }
  },
  perform: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers', 1, statsContext?.tags)
    return editContactInfo(request, [payload], 'add', statsContext)
  },
  performBatch: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers.batch', 1, statsContext?.tags)
    return editContactInfo(request, payload, 'add', statsContext)
  }
}

export default action
