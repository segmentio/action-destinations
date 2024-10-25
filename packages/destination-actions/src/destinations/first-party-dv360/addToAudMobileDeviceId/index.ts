import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { advertiser_id, external_id, mobileDeviceIds } from '../properties'
import { editDeviceMobileIds } from '../functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Edit Customer Match Members - Mobile Device Id List',
  description: 'Add or update customer match members in Google Display & Video 360 Mobile Device Id List Audience.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    mobileDeviceIds: { ...mobileDeviceIds },
    external_id: { ...external_id },
    advertiser_id: { ...advertiser_id }
  },
  perform: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers', 1, statsContext?.tags)
    return editDeviceMobileIds(request, [payload], 'add', statsContext)
  },
  performBatch: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers.batch', 1, statsContext?.tags)
    return editDeviceMobileIds(request, payload, 'add', statsContext)
  }
}

export default action
