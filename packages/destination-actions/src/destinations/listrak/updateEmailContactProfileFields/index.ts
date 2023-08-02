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
        'Add key value pairs to set one or more profile fields. The key is the profile field ID you want to set. Find this under Help & Support > API ID Information in https://admin.listrak.com. The value is the profile field value. (i.e. 1234 = on)',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
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
      requestsByListId[p.listId].push({
        emailAddress: p.emailAddress,
        segmentationFieldValues: createValidSegmentationFields(p.profileFieldValues)
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

function createValidSegmentationFields(profileFieldValues: { [k: string]: unknown }): SegmentationFieldValue[] {
  return Object.keys(profileFieldValues)
    .filter((x) => parseInt(x))
    .map((x) => {
      const segmentationFieldValue: SegmentationFieldValue = {
        segmentationFieldId: parseInt(x),
        value: profileFieldValues[x] + ''
      }
      return segmentationFieldValue
    })
}
