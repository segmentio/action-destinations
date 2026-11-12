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
      event_type: { '@path': '$.properties.journey_context.analytics_event.event_type' },
      event_timestamp: { '@path': '$.properties.journey_context.analytics_event.event_timestamp' },
      transition_from_step: { '@path': '$.properties.journey_context.analytics_event.transition_from_step' },
      step_id: { '@path': '$.properties.journey_context.analytics_event.step_id' },
      step_name: { '@path': '$.properties.journey_context.analytics_event.step_name' },
      instance_id: { '@path': '$.properties.journey_context.analytics_event.instance_id' },
      concurrency_key: { '@path': '$.properties.journey_context.analytics_event.concurrency_key' },
      user_id: { '@path': '$.userId' },
      personas_computation_key: { '@path': '$.context.personas.computation_key' },
      personas_computation_id: { '@path': '$.context.personas.computation_id' },
      personas_activation_id: { '@path': '$.context.personas.event_emitter_id' },
      personas_computation_class: { '@path': '$.context.personas.computation_class' },
      event_name: { '@path': '$.event' }
    }
  }
}
