import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Noop',
  description: 'A NOOP Action used for private internal services',
  fields: {
    noop: {
      label: 'NOOP',
      description: 'A single NOOP field',
      type: 'string'
    },
    // TEMPORARY bug-bash (required-field safety probes, scratch): each field tests a different
    // "required" edge case to confirm none of them accidentally become unconditionally required
    // in CP. Never merge.
    // (a) required omitted entirely -> should be NOT required
    probeOmitted: {
      label: 'Probe Omitted',
      description: 'required key omitted; should be optional',
      type: 'string'
    },
    // (b) required explicitly false -> should be NOT required
    probeFalse: {
      label: 'Probe False',
      description: 'required:false; should be optional',
      type: 'string',
      required: false
    },
    // (c) REVERSE probe: previously pushed as required:true, now flipped to false.
    // Verifies the requirement is actually REMOVED in CP (drops from fieldSchema.required[]),
    // not stuck-on. Never merge.
    probeTrue: {
      label: 'Probe True',
      description: 'required flipped true->false; should become optional',
      type: 'string',
      required: false
    },
    // (d) conditionally required -> should be optional at the flat level, conditional in schema
    probeConditional: {
      label: 'Probe Conditional',
      description: 'required only when noop is "x"',
      type: 'string',
      required: {
        match: 'all',
        conditions: [{ fieldKey: 'noop', operator: 'is', value: 'x' }]
      }
    }
  },
  perform: (_, { statsContext }) => {
    statsContext?.statsClient.incr('actions_noop_perform_hit', 1)
    return undefined
  }
}

export default action
