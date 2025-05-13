import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  columns: {
    label: 'Columns',
    description: `Column write to the DWH.`,
    type: 'object',
    defaultObjectUI: 'keyvalue',
    required: true,
    additionalProperties: true,
    default: { '@path': '$.event' }
  }
}
