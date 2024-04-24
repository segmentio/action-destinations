import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { subscribeProfiles, formatSubscribeProfile } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe Profile',
  description: 'Subscribe Klaviyo profiles to Email marketing, SMS marketing, or both.',
  fields: {
    email: {
      label: 'Email',
      description: `The email address to subscribe. If provided, the associated profile will be subscribed to Email marketing.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$.context.traits.email' }
    },
    phone_number: {
      label: 'Phone Number',
      description: `The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be subscribed to SMS marketing.`,
      type: 'string',
      default: { '@path': '$.context.traits.phone' }
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.`,
      type: 'string',
      dynamic: true
    },
    custom_source: {
      label: 'Custom Source',
      description: 'A custom method or source to detail source of consent preferences (e.g., "Marketing Event").',
      type: 'string',
      default: 'Segment Klaviyo (Actions) Destination'
    },
    consented_at: {
      label: 'Consented At',
      description: `The timestamp of when the profile's consent was gathered.`,
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Klaviyo',
      description:
        'When enabled, the action will use the klaviyo batch API. Fields "List Id" and "Custom Source" will need to be static values if batching is enabled.'
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, phone_number, consented_at, list_id, custom_source } = payload
    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }
    const profileToSubscribe = formatSubscribeProfile(email, phone_number, consented_at)
    await subscribeProfiles(profileToSubscribe, custom_source, list_id, request)
  },
  performBatch: async (request, { payload }) => {
    const filteredPayload = payload.filter((profile) => profile.email || profile.phone_number)
    if (payload.length === 0) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }
    const { list_id, custom_source } = filteredPayload[0]
    const profilesForImport = filteredPayload.map(({ list_id, custom_source, ...profile }) =>
      formatSubscribeProfile(profile.email, profile.phone_number, profile.consented_at)
    )
    // max number of profiles is 100 per request
    for (let i = 0; i < profilesForImport.length; i += 100) {
      const batch = profilesForImport.slice(i, i + 100)
      await subscribeProfiles(batch, custom_source, list_id, request)
    }
  }
}

export default action
