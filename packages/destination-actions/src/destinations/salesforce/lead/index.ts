import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: '',
  fields: {
    crud_operation: {
      label: 'CRUD Operation',
      type: 'string',
      description: 'Create, Update, Upsert',
      dynamic: true
    },
    external_id: {
      label: 'External ID',
      type: 'string',
      description: 'External ID',
      dynamic: true
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email'
    }
  },
  dynamicFields: {
    crud_operation: () => {
      return {
        data: [
          { label: 'Create', value: 'create' },
          { label: 'Update', value: 'update' },
          { label: 'Upsert', value: 'upsert' }
        ]
      }
    },
    external_id: async (request, { auth }) => {
      const res = await request('https://salesforce.com/<external ID endpoint>', {
        method: 'post',
        headers: { authorization: `Bearer ${auth.accessToken}` }
      })

      if (res.statusCode !== 200) { throw new Error() }

      return {
        ...res.body.items
      }

    }
  },
  perform: async (request, { payload, auth }) => {

    // POC of upsert Operation
    if (payload.crud_operation === 'upsert') {
      // Query SF for Lead object on email trait
      const lead = await request('https://salesforce.com/<lead object endpoint>', {
        method: 'post',
        headers: { authorization: `Bearer ${auth.accessToken}` }
      })

      // Create if non-existant
      if (!lead) {
        return request('https://salesforce.com/<lead object endpoint>/create', {
          method: 'post',
          json: {
            ...payload
          }
        })
      }

      // Else just update
      return request('https://salesforce.com/<lead object endpoint>/update', {
        method: 'post',
        json: {
          ...payload
        }
      })


    }

  }
}

export default action
