import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RequestClient } from '@segment/actions-core'

export type SegmentationFieldValue = {
  segmentationFieldId: number
  value: string
}

export type ContactSegmentationFieldValues = {
  emailAddress: string
  segmentationFieldValues: SegmentationFieldValue[]
}

type RequestsByListId = { [k: number]: ContactSegmentationFieldValues[] }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Email Contact Profile Fields',
  description:
    'One or more list imports will be started to update the specified contact profile fields on the specified list.',
  fields: {
    listId: {
      label: 'List ID',
      description:
        'Identifier used to locate the list. Find this under Help & Support > API ID Information in https://admin.listrak.com.',
      type: 'integer',
      required: true
    },
    emailAddress: {
      label: 'Email Address',
      description: 'Email address of the contact.',
      type: 'string',
      format: 'email',
      default: {
        '@path': '$.context.traits.email'
      },
      required: true
    },
    profileFieldValues: {
      label: 'Profile Field Values',
      description:
        'Add one or more profile field IDs as object keys. You can find these IDs under Help & Support > API ID Information on https://admin.listrak.com. Choose one of three options as the object value: "on" (activates this field in Listrak), "off" (deactivates this field in Listrak), or "useAudienceKey" (Listrak sets the field based on the Segment Audience payload\'s audience_key: "true" activates the field, "false" deactivates it).',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    properties: {
      label: 'Properties Object',
      description: 'The properties object',
      type: 'object',
      unsafe_hidden: true,
      default: {
        '@path': '$.properties'
      }
    },
    audience_key: {
      label: 'Audience Key',
      description: 'The key that determines if the contact is in the audience or not.',
      type: 'string',
      readOnly: true,
      default: { '@path': '$.properties.audience_key' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Listrak',
      description:
        'When enabled, multiple events will be sent to Listrak in a single request, which is recommended for optimal performance.',
      required: true,
      default: true
    }
  },
  perform: async (request, { payload }) => {
    return await processPayload(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return await processPayload(request, payload)
  }
}

async function processPayload(request: RequestClient, payload: Payload[]) {
  const requestsByListId: RequestsByListId = {}

  payload
    .filter((x) => x.emailAddress && x.profileFieldValues)
    .forEach((p) => {
      if (!requestsByListId[p.listId]) {
        requestsByListId[p.listId] = []
      }

      let audienceEntered = null
      if (p.audience_key && p.properties) {
        audienceEntered = p.properties[p.audience_key]
        if (typeof audienceEntered !== 'boolean') {
          audienceEntered = null
        }
      }
      requestsByListId[p.listId].push({
        emailAddress: p.emailAddress,
        segmentationFieldValues: createValidSegmentationFields(p.profileFieldValues, audienceEntered)
      })
    })

  for (const listId in requestsByListId) {
    await request(`https://api.listrak.com/email/v1/List/${listId}/Contact/SegmentationField`, {
      method: 'POST',
      json: requestsByListId[listId]
    })
  }
}

export default action

function createValidSegmentationFields(
  profileFieldValues: { [k: string]: unknown },
  audienceEntered: boolean | null
): SegmentationFieldValue[] {
  return Object.keys(profileFieldValues)
    .filter((x) => parseInt(x))
    .map((x) => {
      const segmentationFieldValue: SegmentationFieldValue = {
        segmentationFieldId: parseInt(x),
        value: setProfileFieldValue(profileFieldValues[x] + '', audienceEntered)
      }
      return segmentationFieldValue
    })
}

function setProfileFieldValue(value: string, audienceEntered: boolean | null): string {
  if (value === 'on' || value === 'off') {
    return value
  }
  // if value is empty "useAudienceKey", determine "on" or "off" based on audience key
  if (value === 'useAudienceKey' && audienceEntered !== null) {
    return audienceEntered ? 'on' : 'off'
  }
  // else return inputted string
  return value
}
