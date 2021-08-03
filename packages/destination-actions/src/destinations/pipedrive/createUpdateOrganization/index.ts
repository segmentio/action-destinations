import dayjs from '../../../lib/dayjs'
import { get } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Organization',
  description: "Update an organization in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "group"',
  fields: {
    identifier: {
      label: 'Organization ID',
      description:
        'Identifier used to find existing organization in Pipedrive. Typically this is the name but it can also be a custom field value. Custom organization fields may be included by using the long hash keys of the custom fields. These look like "33595c732cd7a027c458ea115a48a7f8a254fa86".',
      type: 'string',
      required: true
    },
    name: {
      label: 'Organization Name',
      description: 'Name of the organization',
      type: 'string',
      required: true
    },
    owner_id: {
      label: 'Owner ID',
      description:
        'ID of the user who will be marked as the owner of this organization. Default is the user who ownes the API token.',
      type: 'number'
    },
    add_time: {
      label: 'Created At',
      description:
        'If the organization is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'string'
    }
  },

  perform: async (request, { payload, settings }) => {
    const search = await request(`https://${settings.domain}.pipedrive.com/api/v1/organizations/search`, {
      searchParams: { term: payload.identifier }
    })

    const organizationId = get(search.data, 'data.items[0].item.id')

    const organization = {
      name: payload.name,
      owner_id: payload.owner_id
    }

    if (organizationId === undefined || organizationId === null) {
      return request(`https://${settings.domain}.pipedrive.com/api/v1/organizations`, {
        method: 'post',
        json: {
          ...organization,
          add_time: payload.add_time ? dayjs.utc(payload.add_time).format('YYYY-MM-DD HH:MM:SS') : undefined
        }
      })
    }

    return request(`https://${settings.domain}.pipedrive.com/api/v1/organizations/${organizationId}`, {
      method: 'put',
      json: organization
    })
  }
}

export default action
