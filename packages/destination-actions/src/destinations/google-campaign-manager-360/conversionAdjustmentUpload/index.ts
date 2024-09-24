import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../utils'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Adjustment Upload',
  description: 'Adjust an conversion in Campaign Manager 360.',
  fields: {
    requiredId: {
      label: 'Required ID',
      description:
        'A user identifier record the conversion against. Exactly one of Google Click ID, Display Click ID, Encrypted User ID, Mobile Device ID, Match ID, Impression ID or Encrypted User ID Candidates must be provided.',
      type: 'object',
      required: true,
      properties: {
        gclid: {
          label: 'Google Click ID',
          description: 'The Google Click ID (gclid) associated with the conversion.',
          type: 'string',
          required: false
        },
        dclid: {
          label: 'Display Click ID',
          description: 'The Display Click ID (dclid) associated with the conversion.',
          type: 'string',
          required: false
        },
        encryptedUserId: {
          label: 'Encrypted User ID',
          description:
            "The encrypted user ID associated with the conversion. If this field is set then 'Encryption Entity ID', 'Encryption Entity Type' and 'Encryption Source' should also be specified.",
          type: 'string',
          required: false
        },
        mobileDeviceId: {
          label: 'Mobile Device ID',
          description: 'The mobile device ID associated with the conversion.',
          type: 'string',
          required: false,
          default: {
            '@path': '$.context.device.id'
          }
        },
        matchId: {
          label: 'Match ID',
          description:
            'The match ID field. A match ID is your own first-party identifier that has been synced with Google using the match ID feature in Floodlight.',
          type: 'string',
          required: false
        },
        impressionId: {
          label: 'Impression ID',
          description: 'The impression ID associated with the conversion.',
          type: 'string',
          required: false
        }
      },
      default: {
        gclid: {
          '@if': {
            exists: { '@path': '$.integrations.Campaign Manager 360.gclid' },
            then: { '@path': '$.integrations.Campaign Manager 360.gclid' },
            else: { '@path': '$.properties.gclid' }
          }
        },
        dclid: {
          '@if': {
            exists: { '@path': '$.integrations.Campaign Manager 360.dclid' },
            then: { '@path': '$.integrations.Campaign Manager 360.dclid' },
            else: { '@path': '$.properties.dclid' }
          }
        },
        encryptedUserId: { '@path': '$.userId' },
        mobileDeviceId: { '@path': '$.context.device.id' },
        matchId: { '@path': '$.properties.matchId' },
        impressionId: { '@path': '$.properties.impressionId' }
      }
    },
    ...commonFields
  },
  perform: async (request, { settings, payload, auth }) => {
    return await send(request, settings, [payload], true, auth)
  },
  performBatch: async (request, { settings, payload, auth }) => {
    return await send(request, settings, payload, true, auth)
  }
}

export default action
