
import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> ={
  identifiers: {
    label: 'Company Identifiers',
    description: 'The company identifier to add or remove from the LinkedIn Company Segment. At least one of Company Domain or LinkedIn Company ID is required.',
    type: 'object',
    additionalProperties: false,
    required: true,
    defaultObjectUI: 'keyvalue:only',
    properties: {
      companyDomain: {
        label: 'Company Domain',
        description: "The company domain to send to LinkedIn. e.g. 'microsoft.com'",
        type: 'string'
      },
      linkedInCompanyId: {
        label: 'LinkedIn Company ID',
        description: "The LinkedIn Company ID to send to LinkedIn.",
        type: 'string'
      }
    },
    default: {
      companyDomain: { '@path': '$.properties.company_domain' },
      linkedInCompanyId: { '@path': '$.properties.linkedin_company_id' }
    }
  },
  action: {
    label: 'DMP Company Action',
    description: 'Specifies if the company should be added or removed from the LinkedIn DMP Company Segment.',
    type: 'string',
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
    choices: [
      { label: `Auto Detect`, value: 'AUTO' },
      { label: `Add`, value: 'ADD' },
      { label: 'Remove', value: 'REMOVE' }
    ],
    default: 'AUTO'
  },
  computation_key: {
    label: '[Hidden] Audience Computation Key',
    description: "[Hidden] Segment's friendly name for the Audience",
    type: 'string',
    required: true,
    unsafe_hidden: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.audience_key' },
        then: { '@path': '$.properties.audience_key' },
        else: { '@path': '$.context.personas.computation_key' }
      }
    }
  },
  props: {
    label: '[Hidden] Traits or properties object',
    description: '[Hidden] A computed object for track and identify events. This field should not need to be edited.',
    type: 'object',
    required: true,
    unsafe_hidden: true,
    default: { '@path': '$.properties' }
  },
  computation_class: {
    label: '[Hidden] Computation Class',
    description: '[Hidden] The computation class for the audience. Used to filter out non Audience payloads.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.context.personas.computation_class'
    },
    choices: [
      { label: 'audience', value: 'audience' },
      { label: 'journey_step', value: 'journey_step' }
    ],
    unsafe_hidden: true
  },
  enable_batching: {
    label: '[Hidden] Enable Batching',
    description: '[Hidden] Enable batching of requests to the LinkedIn DMP Segment.',
    type: 'boolean',
    default: true,
    unsafe_hidden: true
  },
  batch_keys: {
    label: '[Hidden] Batch Keys',
    description: '[Hidden] Batch key used to ensure a batch contains payloads from a single Audience only.',
    type: 'string',
    unsafe_hidden: true,
    required: true,
    multiple: true,
    default: ['computation_key']
  }
}