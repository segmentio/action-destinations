export default {
  // note that this must be `properties` to be processed by the warehouse pipeline
  properties: {
    label: 'Columns',
    description: `Additional columns to write to Snowflake.`,
    type: 'object',
    defaultObjectUI: 'keyvalue',
    required: true,
    additionalProperties: true,
    default: {
      entity_context: {
        '@json': {
          mode: 'encode',
          value: {
            '@path': '$.properties.data_graph_entity_context'
          }
        }
      },
      user_id: { '@path': '$.userId' },
      audience_key: { '@path': '$.properties.audience_key' },
      personas_computation_key: { '@path': '$.context.personas.computation_key' },
      personas_computation_id: { '@path': '$.context.personas.computation_id' },
      personas_computation_run_id: { '@path': '$.context.personas.computation_run_id' },
      personas_activation_id: { '@path': '$.context.personas.event_emitter_id' }
    }
  }
}
