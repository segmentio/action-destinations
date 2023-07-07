import type { ActionDefinition, ExecuteInput } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAuthToken } from '../listrak'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Contact Profile Fields',
  description: '',
  fields: {
    listId: {
      label: 'List ID',
      description: 'Identifier used to locate the list.',
      type: 'number',
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
        'Add key value pairs to set one or more profile fields. The key is the profile field ID you want to set. The value is the profile field value.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      default: {
        123: 'on'
      }
    }
  },
  perform: async (request, data) => {
    const accessToken = await getAuthToken(request, data.settings)

    await request(`https://api.listrak.com/email/v1/List/${data.payload.listId}/Contact/SegmentationField`, {
      method: 'POST',
      json: [
        {
          emailAddress: data.payload.emailAddress,
          segmentationFieldValues: mapSegmentationFieldValues(filterInvalidProfileFields(data))
        }
      ],
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }
}
export default action

function mapSegmentationFieldValues(profileFields: any[]) {
  return profileFields.map((x) => {
    return {
      segmentationFieldId: parseInt(x),
      value: profileFields[x]
    }
  })
}

function filterInvalidProfileFields(profileFields: ExecuteInput<Settings, Payload>) {
  return Object.keys(profileFields.payload.profileFieldValues).filter((x) => parseInt(x))
}
