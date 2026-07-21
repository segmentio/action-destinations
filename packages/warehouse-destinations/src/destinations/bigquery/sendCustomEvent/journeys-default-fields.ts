export default {
  // note that this must be `properties` to be processed by the warehouse pipeline
  properties: {
    label: 'Columns',
    description: `Additional columns to write to BigQuery.`,
    type: 'object',
    defaultObjectUI: 'keyvalue',
    required: true,
    additionalProperties: true,
    default: {
      journey_metadata: {
        '@json': {
          mode: 'encode',
          value: {
            '@path': '$.properties.journey_metadata'
          }
        }
      },
      journey_context: {
        '@json': {
          mode: 'encode',
          value: {
            '@path': '$.properties.journey_context'
          }
        }
      },
      user_id: { '@path': '$.userId' },
      personas_computation_key: { '@path': '$.context.personas.computation_key' },
      personas_computation_id: { '@path': '$.context.personas.computation_id' },
      personas_activation_id: { '@path': '$.context.personas.event_emitter_id' },
      personas_computation_class: { '@path': '$.context.personas.computation_class' },
      event_name: { '@path': '$.event' }
    }
  }
}
