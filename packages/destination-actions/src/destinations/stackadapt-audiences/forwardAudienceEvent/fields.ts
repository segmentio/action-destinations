import { InputField } from '@segment/actions-core'

export const audience_only_fields: Record<string, InputField> = {
    marketing_status: {
      label: 'Marketing Status',
      description: 'In certain jurisdictions, explicit consent may be required to send email marketing communications to imported profiles. Consult independent counsel for further guidance.',
      type: 'string',
      required: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      choices: [
        { label: 'Opted-in (Profiles can receive email marketing)', value: 'Opted-in' },
        { label: 'Indeterminate (Profiles that have not opted-out, but are excluded from email marketing)', value: 'Indeterminate' }
      ]
    },
    traits_or_props: {
      label: 'Event Properties',
      type: 'object',
      description: 'The properties of the user or event.',
      unsafe_hidden: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    segment_computation_class: {
      label: 'Segment Computation Class',
      required: true,
      description: "Segment computation class used to determine if input event is from an Engage Audience'.",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' },{ label: 'journey_step', value: 'journey_step' }]
    },
    segment_computation_id: {
      label: 'Segment Computation ID',
      description: 'For audience enter/exit events, this will be the audience ID.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_computation_key: {
      label: 'Segment Computation Key',
      description: 'For audience enter/exit events, this will be the audience key.',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    }
}