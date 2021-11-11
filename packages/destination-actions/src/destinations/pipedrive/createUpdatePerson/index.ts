import dayjs from '../../../lib/dayjs'
import { DynamicFieldItem, get } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

interface Organizations {
  data: Organization[]
  additional_data: {
    pagination: {
      next_start?: number
    }
  }
}

interface PersonFields {
  data: PipedriveField[],
  additional_data: {
    pagination: {
      next_start?: number
    }
  }
}

interface PipedriveField {
  name: string,
  key: string
}

interface Organization {
  id: string
  name: string
}

interface Person {
  name: string
  org_id?: number
  email?: string[]
  phone?: string
  add_time?: string
}

let personFields: DynamicFieldItem[] = [];

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Person',
  description: "Update a person in Pipedrive or create them if they don't exist yet.",
  defaultSubscription: 'type = "identify"',
  fields: {
    match_field: {
      label: 'Match field',
      description: 'Field used to find existing person in Pipedrive.',
      type: 'string',
      required: true,
      dynamic: true,
      default: {
        '@literal': 'id'
      },

    },
    match_value: {
      label: 'Match value',
      description: 'Value to find existing person by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      label: 'Person Name',
      description: 'Name of the person',
      type: 'string',
      required: true
    },
    org_id: {
      label: 'Organization ID',
      description: 'ID of the organization this person will belong to.',
      type: 'number',
      dynamic: true
    },
    email: {
      label: 'Email Address',
      description: 'Email addresses for this person.',
      type: 'string',
      multiple: true
    },
    phone: {
      label: 'Phone Number',
      description: 'Phone number for the person.',
      type: 'string'
    },
    add_time: {
      label: 'Created At',
      description: 'If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'string'
    }
  },

  dynamicFields: {
    match_field: async (request, { settings }) => {
      if (!personFields.length) {
        const response = await request<PersonFields>(`https://${settings.domain}.pipedrive.com/api/v1/personFields`);
        const body = response.data;
        personFields = body.data.map(f => ({
          label: f.name,
          value: f.key,
        }));
      }
      return {
        body: {
          data: personFields,
          pagination: {}
        },
      };
    },
    org_id: async (request, { page, settings }) => {
      const searchParams: Record<string, number> = {}
      if (typeof page === 'string') {
        searchParams.start = Number(page)
      }

      const response = await request<Organizations>(`https://${settings.domain}.pipedrive.com/api/v1/organizations`, {
        searchParams
      })
      const body = response.data

      const items = body.data.map((organization) => ({
        label: organization.name,
        value: organization.id
      }))

      let nextPage: string | undefined

      if (typeof body.additional_data.pagination.next_start === 'number') {
        nextPage = String(body.additional_data.pagination.next_start)
      }

      return {
        body: {
          data: items,
          pagination: { nextPage }
        }
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const search = await request(`https://${settings.domain}.pipedrive.com/api/v1/persons/search`, {
      searchParams: { term: payload.match_value, exact_match: true, fields: payload.match_field }
    })

    const personId = get(search.data, 'data.items[0].item.id')

    const person: Person = {
      name: payload.name,
      org_id: payload.org_id,
      email: payload.email,
      phone: payload.phone
    }

    if (personId === undefined || personId === null) {
      if (payload.add_time) {
        person.add_time = dayjs.utc(person.add_time).format('YYYY-MM-DD HH:MM:SS')
      }

      return request(`https://${settings.domain}.pipedrive.com/api/v1/persons`, { method: 'post', json: person })
    }

    return request(`https://${settings.domain}.pipedrive.com/api/v1/persons/${personId}`, {
      method: 'put',
      json: person
    })
  }
}

export default action
