import type { ActionDefinition, APIError, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { makePostRequest, makeGetRequest, getAuthToken } from '../listrak'
import { HTTPError } from '@segment/actions-core'

interface List {
  listId: number
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
      type: 'integer',
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
        const response: ListsResponse = await makeGetRequest<ListsResponse>(
          request,
          data.settings,
          'https://api.listrak.com/email/v1/List'
        )

        const choices = response.data.data
          .sort(function (a, b) {
            return a.listName.toLowerCase().localeCompare(b.listName.toLowerCase())
          })
          .map((list) => {
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
            message: (err as HTTPError).message ?? 'Unknown error',
            code: (err as HTTPError).response.status + '' ?? 'Unknown error'
          }
        }
      }
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
  }
}
export default action

function createValidSegmentationFields(profileFieldValues: { [k: string]: unknown }) {
  return Object.keys(profileFieldValues)
    .filter((x) => parseInt(x))
    .map((x) => {
      return {
        segmentationFieldId: parseInt(x),
        value: profileFieldValues[x]
      }
    })
}
