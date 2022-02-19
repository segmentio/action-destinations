import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import Salesforce from '../sf-operations'
import { customFields, operation, traits, validateLookup } from '../sf-properties'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Opportunity',
  description: 'Opportunity action',
  fields: {
    operation: operation,
    traits: traits,
    amount: {
      label: 'Amount',
      description: 'Estimated total sale amount',
      type: 'string'
    },
    close_date: {
      label: 'Close Date',
      description: 'Date when the opportunity is expected to close. This is required to create an opportunity.',
      type: 'string',
      required: true
    },
    description: {
      label: 'Description',
      description: 'A text description of the opportunity.',
      type: 'string'
    },
    name: {
      label: 'Name',
      description: 'A name for the opportunity. This is required to create an opportunity.',
      type: 'string',
      required: true
    },
    stage_name: {
      label: 'Stage Name',
      description:
        'Current stage of the opportunity. This is required to create an opportunity. The Stage Name value must match available picklist values in the OpportunityStage object.',
      type: 'string',
      required: true
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      return await sf.createRecord(payload, 'Opportunity')
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, 'Opportunity')
    }

    if (payload.operation === 'upsert') {
      return await sf.upsertRecord(payload, 'Opportunity')
    }
  }
}

export default action
