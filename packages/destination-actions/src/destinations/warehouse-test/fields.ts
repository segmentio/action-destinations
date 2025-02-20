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
    default: {
      event: {
        '@path': '$.event'
      },
      type: {
        '@path': '$.type'
      },
      userId: {
        '@path': '$.userId'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      },
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      },
      properties: {
        '@path': '$.properties'
      },
      traits: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.context.traits' }
        }
      },
      context: {
        '@path': '$.context'
      },
      timestamp: {
        '@path': '$.timestamp'
      },
      messageId: {
        '@path': '$.messageId'
      },
      integrations: {
        '@path': '$.integrations'
      },
      audienceName: {
        '@path': '$.context.personas.computation_key'
      },
      audienceId: {
        '@path': '$.context.personas.computation_id'
      },
      spaceId: {
        '@path': '$.context.personas.space_id'
      },
      entityContext: {
        '@json': {
          mode: 'encode',
          value: {
            '@path': '$.properties.data_graph_entity_context'
          }
        }
      }
    }
  }
}
