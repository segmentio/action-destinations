import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { makePostRequest } from '../listrak'

export type SegmentationFieldValue = {
  segmentationFieldId: number
  value: string
}

export type ContactSegmentationFieldValues = {
  emailAddress: string
  segmentationFieldValues: SegmentationFieldValue[]
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Email Contact Profile Fields',
  description: '',
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
    }
  },
  perform: async (request, data) => {
    await makePostRequest(
      request,
      data.settings,
      `https://api.listrak.com/email/v1/List/${data.payload.listId}/Contact/SegmentationField`,
      [
        {
          emailAddress: data.payload.emailAddress,
          segmentationFieldValues: createValidSegmentationFields(data.payload.profileFieldValues)
        }
      ]
    )
  },
  performBatch: async (request, data) => {
    const dict: { [k: number]: ContactSegmentationFieldValues[] } = {}

    data.payload
      .filter((x) => x.emailAddress && x.profileFieldValues)
      .forEach((p) => {
        if (!dict[p.listId]) {
          dict[p.listId] = []
        }
        dict[p.listId].push({
          emailAddress: p.emailAddress,
          segmentationFieldValues: createValidSegmentationFields(p.profileFieldValues)
        })
      })

    for (const listId in dict) {
      await makePostRequest(
        request,
        data.settings,
        `https://api.listrak.com/email/v1/List/${listId}/Contact/SegmentationField`,
        dict[listId]
      )
    }
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
