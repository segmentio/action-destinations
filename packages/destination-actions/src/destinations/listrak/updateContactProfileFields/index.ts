import type { ActionDefinition, APIError, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAuthToken } from '../listrak'

interface List {
  listId: number,
  listName: string
}

interface ListData {
  data: List[]
}

interface ListsResponse {
  data: ListData
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Contact Profile Fields',
  description: '',
  fields: {
    listId: {
      label: 'List ID',
      description: 'Identifier used to locate the list.',
      type: 'string',
      dynamic: true,
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
  dynamicFields: {
    listId: async (request, data): Promise<DynamicFieldResponse> => {
      try {
        const accessToken = await getAuthToken(request, data.settings)

        const response: ListsResponse = await request('https://api.listrak.com/email/v1/List', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          skipResponseCloning: true
        })

        const choices = response.data.data.sort(function (a, b) {
          return a.listName.toLowerCase().localeCompare(b.listName.toLowerCase());
        }).map((list) => {
          return { value: list.listId.toString(), label: list.listName }
        })
        
        return {
          choices
        }
      } catch (err) {
        return {
          choices: [],
          nextPage: '',
          error: {
            message: (err as APIError).message ?? 'Unknown error',
            code: (err as APIError).status + '' ?? 'Unknown error'
          }
        }
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
          segmentationFieldValues: createValidSegmentationFields(data.payload.profileFieldValues)
        }
      ],
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }
}
export default action

function createValidSegmentationFields(profileFieldValues:  {[k: string]: unknown}) {
  return Object.keys(profileFieldValues).filter((x) => parseInt(x)).map(x => {
    return {
      segmentationFieldId: parseInt(x),
      value: profileFieldValues[x]
    }
  })
}
