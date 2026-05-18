import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const MNTN_API_BASE = 'https://integrations.ex.mountain.com'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove from Audience',
  description:
    'Remove a user from an MNTN audience segment when they exit a Segment Engage audience. Uses the same identity ID that was provided when the user was added.',

  defaultSubscription: 'event = "Audience Exited"',

  fields: {
    segment_id: {
      label: 'MNTN Segment ID',
      description:
        'The ID of the MNTN audience segment to remove this user from. Automatically populated from the audience setup — do not change unless you need to override it.',
      type: 'string',
      required: true,
      default: {
        // Segment stores the externalId returned by createAudience here.
        '@path': '$.context.personas.external_audience_id'
      }
    },

    identity_id: {
      label: 'Identity ID',
      description:
        'The ID used to identify this user in MNTN. Must be consistent with the value used during the Add to Audience call. Defaults to userId, falling back to anonymousId.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },

  perform: (request, { payload }) => {
    const segmentId = encodeURIComponent(payload.segment_id)
    const identityId = encodeURIComponent(payload.identity_id)

    // MNTN DELETE endpoint removes the identity from the segment asynchronously.
    // The endpoint always succeeds — it does not check whether the identity
    // currently belongs to the segment (per API spec).
    return request(
      `${MNTN_API_BASE}/v2026/audience/segments/${segmentId}/identities/${identityId}`,
      { method: 'DELETE' }
    )
  }
}

export default action
