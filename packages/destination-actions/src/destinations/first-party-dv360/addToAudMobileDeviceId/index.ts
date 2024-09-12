import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, mobileDeviceIds } from '../properties'
import { addDeviceMobileIds } from '../functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Edit Customer Match Members - Mobile Device Id List',
  description: 'Add or update customer match members in Google Display & Video 360 Mobile Device Id List Audience.',
  defaultSubscription: 'event = "Audeince Entered - MobileDeviceIdList"',
  fields: {
    mobileDeviceIds: { ...mobileDeviceIds },
    external_id: { ...external_id }
  },
  perform: async (request, { payload, statsContext, audienceSettings }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers', 1, statsContext?.tags)
    console.log('Pre-Payload', payload)
    console.log('Pre-audienceSettings', audienceSettings)
    return addDeviceMobileIds(request, audienceSettings, [payload], statsContext)
  },
  performBatch: async (request, { payload, statsContext, audienceSettings }) => {
    statsContext?.statsClient?.incr('editCustomerMatchMembers.batch', 1, statsContext?.tags)
    console.log('Pre-Payload', payload)
    console.log('Pre-audienceSettings', audienceSettings)
    return addDeviceMobileIds(request, audienceSettings, payload, statsContext)
  }
}

export default action
