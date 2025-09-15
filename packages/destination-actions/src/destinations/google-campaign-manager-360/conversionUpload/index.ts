import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getCustomVarTypeChoices, send } from '../utils'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Upload',
  description: 'Send a conversion to Campaign Manager 360.',
  fields: {
    customVariables: {
      label: 'Custom Variables',
      description: 'Custom variables associated with the conversion.',
      type: 'object',
      multiple: true,
      required: false,
      additionalProperties: false,
      properties: {
        type: {
          label: 'Type',
          description: 'The type of the custom variable.',
          type: 'string',
          allowNull: false,
          required: true,
          choices: getCustomVarTypeChoices()
        },
        value: {
          label: 'Value',
          description: 'The value of the custom variable.',
          type: 'string',
          allowNull: false,
          required: true
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.customVariables',
          {
            type: {
              '@path': '$.type'
            },
            value: {
              '@path': '$.value'
            }
          }
        ]
      }
    },
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
        },
        encryptedUserIdCandidates: {
          label: 'Encrypted User ID Candidates',
          description:
            'A comma separated list of the alphanumeric encrypted user IDs. Any user ID with exposure prior to the conversion timestamp will be used in the inserted conversion. If no such user ID is found then the conversion will be rejected with INVALID_ARGUMENT error. When set, `encryptionInfo` should also be specified.',
          type: 'string',
          required: false,
          category: 'hashedPII'
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
        impressionId: { '@path': '$.properties.impressionId' },
        encryptedUserIdCandidates: { '@path': '$.properties.encryptedUserIdCandidates' }
      }
    },
    ...commonFields
  },
  perform: async (request, { settings, payload, auth }) => {
    return await send(request, settings, [payload], false, auth)
  },
  performBatch: async (request, { settings, payload, auth }) => {
    return await send(request, settings, payload, false, auth)
  }
}

export default action
