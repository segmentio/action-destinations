import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Account',
  description: '',
  fields: {
    operation: {
      label: 'Operation',
      description: 'CRUD Operation to perform',
      type: 'string',
      choices: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Upsert', value: 'upsert' }
      ]
    }
  },
  perform: (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      sf.createRecord(payload, 'Account')
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, 'Lead')
    }

    if (payload.operation === 'upsert') {
      if (!payload.company || !payload.last_name) {
        throw new IntegrationError('Missing company or last_name value', 'Misconfigured required field', 400)
      }
      return await sf.upsertRecord(payload, 'Lead')
    }
    
  }
}

export default action
