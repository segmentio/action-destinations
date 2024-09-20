import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AUDIENCE_PROPERTY, PS_BASE_URL } from '../const'
import { SubscriberResp } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences',
  description: 'Sync Engage Audiences to Postscript',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Audience ID',
      description: 'Segment Audience ID to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      required: true,
      choices: [{ value: 'audience', label: 'audience' }]
    },
    email: {
      label: 'Email address',
      description: "The user's email address. Required if phone is not provided.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: "The user's phone number. Required if email is not provided.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    }
  },
  perform: async (request, { payload }) => {
    let { email, phone } = payload

    email = email?.trim()
    phone = phone?.replace(/\D/g, '').trim()

    if (!email && !phone) {
      throw new PayloadValidationError('Either email or phone is required')
    }

    const audienceAction = payload.traits_or_props[payload.segment_audience_key]

    let subscriber

    if (phone) {
      const response = await request<SubscriberResp>(PS_BASE_URL + '/api/v2/subscribers', {
        method: 'get',
        searchParams: {
          phone_number__eq: phone
        }
      })

      if (response.data && response.data.subscribers && response.data.subscribers.length > 0) {
        subscriber = response.data.subscribers[0]
      }
    }

    if (!subscriber && email) {
      const response = await request<SubscriberResp>(PS_BASE_URL + '/api/v2/subscribers', {
        method: 'get',
        searchParams: {
          email__eq: email
        }
      })

      if (response.data && response.data.subscribers && response.data.subscribers.length > 0) {
        subscriber = response.data.subscribers[0]
      }
    }

    if (subscriber) {
      let makeUpdate = false
      const audiences: string[] = subscriber?.properties?.[AUDIENCE_PROPERTY] || []
      const exist = audiences.includes(payload.segment_audience_key)

      if (audienceAction == true && !exist) {
        audiences.push(payload.segment_audience_key)
        makeUpdate = true
      } else if (audienceAction == false && exist) {
        const index = audiences.indexOf(payload.segment_audience_key)
        audiences.splice(index, 1)
        makeUpdate = true
      }

      if (makeUpdate) {
        await request(`${PS_BASE_URL}/api/v2/subscribers/${subscriber.id}`, {
          method: 'patch',
          json: {
            properties: {
              [AUDIENCE_PROPERTY]: audiences
            }
          }
        })
      }
    }
  }
}

export default action
