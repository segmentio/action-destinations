import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

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
    segmentationFieldValues: {
      label: 'Segmentation Field Values',
      description: 'Profile field values associated with the contact.',
      type: 'object',
      multiple: true,
      required: true,
      properties: {
        segmentationFieldId: {
          label: 'Segmentation Field ID',
          description: 'Identifier of the profile field.',
          type: 'number',
          required: true
        },
        value: {
          label: 'Value',
          description: 'Value of the profile field.',
          type: 'string',
          required: true
        }
      }
    }
  },
  perform: async (request, data) => {
    const res = await request(`https://auth.listrak.com/OAuth2/Token`, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: data.settings.client_id,
        client_secret: data.settings.client_secret,
        grant_type: 'client_credentials'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const json = await res.json()
    const accessToken = json.access_token

    await request(`https://api.listrak.com/email/v1/List/${data.payload.listId}/Contact/SegmentationField`, {
      method: 'POST',
      json: [
        {
          emailAddress: data.payload.emailAddress,
          segmentationFieldValues: data.payload.segmentationFieldValues
        }
      ],
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }
}

export default action
