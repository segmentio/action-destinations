import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Upload',
  description: "Inserts a conversion into Campaign Manager 360's profile configured under Settings.",
  fields: {
    gclid: {
      label: 'Google Click ID',
      description: 'The Google Click ID (gclid) associated with the conversion.',
      type: 'string',
      required: false
    },
    dclid: {
      label: 'Display Click ID',
      description: 'The Display Click ID (dclid) associated with the conversion.',
      type: 'string',
      required: false
    },
    floodlightActivityId: {
      label: 'Floodlight Activity ID',
      description: 'The Floodlight activity ID associated with the conversion.',
      type: 'string',
      required: true
    },
    floodlightConfigurationId: {
      label: 'Floodlight Configuration ID',
      description: 'The Floodlight configuration ID associated with the conversion.',
      type: 'string',
      required: true
    },
    ordinal: {
      label: 'Ordinal',
      description: 'The ordinal value of the conversion.',
      type: 'number',
      required: false
    },
    quantity: {
      label: 'Quantity',
      description: 'The quantity of the conversion.',
      type: 'number',
      required: false
    },
    timestampMicros: {
      label: 'Timestamp (Microseconds)',
      description: 'The timestamp of the conversion in microseconds.',
      type: 'number',
      required: false
    },
    value: {
      label: 'Value',
      description: 'The value of the conversion.',
      type: 'number',
      required: false
    },
    customVariables: {
      label: 'Custom Variables',
      description: 'Custom variables associated with the conversion.',
      type: 'object',
      required: false
    }
  },
  perform: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
