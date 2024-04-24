import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'
import { PayloadValidationError } from '@segment/actions-core'
import { unsubscribeProfiles, formatUnsubscribeProfile } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Unsubscribe Profile',
  description: 'Unsubscribe Klaviyo profiles from Email marketing, SMS marketing, or both.',
  fields: {
    email: {
      label: 'Email',
      description: `The email address to subscribe. If provided, the associated profile will be unsubscribed to Email marketing.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$.context.traits.email' }
    },
    phone_number: {
      label: 'Phone Number',
      description: `The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be unsubscribed to SMS marketing.`,
      type: 'string',
      default: { '@path': '$.context.traits.phone' }
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to remove the subscribed profiles from. If no list id is provided, the profile will be unsubscribed from all channels.`,
      type: 'string',
      dynamic: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Klaviyo',
      description:
        'When enabled, the action will use the klaviyo batch API. Field "List Id" will need to be static values when batching is enabled.'
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, phone_number, list_id } = payload
    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const profile = formatUnsubscribeProfile(email, phone_number)
    await unsubscribeProfiles(profile, list_id, request)
  },
  performBatch: async (request, { payload }) => {
    const filteredPayload = payload.filter((profile) => profile.email || profile.phone_number)
    if (payload.length === 0) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }
    const { list_id } = filteredPayload[0]
    const profilesForImport = filteredPayload.map(({ list_id, ...profile }) =>
      formatUnsubscribeProfile(profile.email, profile.phone_number)
    )
    // max number of profiles is 100 per request
    for (let i = 0; i < profilesForImport.length; i += 100) {
      const batch = profilesForImport.slice(i, i + 100)
      await unsubscribeProfiles(batch, list_id, request)
    }
  }
}

export default action
