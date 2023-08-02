import type { ActionDefinition, ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { M3TER_INGEST_API, MAX_MEASUREMENTS_PER_BATCH } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Measurements',
  description: 'Submits your measurements data to m3ter',
  defaultSubscription: 'type = "track"',
  fields: {
    uid: {
      label: 'm3ter UUID',
      type: 'string',
      description: 'Unique ID for this measurement',
      required: true,
      default: { '@path': '$.properties.uid' }
    },
    meter: {
      label: 'Meter',
      type: 'string',
      description: 'Short code identifying the Meter the measurement is for',
      required: true,
      default: { '@path': '$.properties.meter' }
    },
    account: {
      label: 'Account',
      type: 'string',
      description: 'Code of the Account the measurement is for',
      required: true,
      default: { '@path': '$.properties.account' }
    },
    ts: {
      label: 'Timestamp',
      type: 'datetime',
      description: 'Timestamp for the measurement',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    ets: {
      label: 'End timestamp',
      type: 'datetime',
      description:
        'End timestamp for the measurement. Can be used in the case a usage event needs to have an explicit start and end rather than being instantaneous',
      required: false
    },
    who: {
      label: 'Who',
      type: 'object',
      description:
        'Non-numeric who values for data measurements, such as: who logged-in to the service; who was contacted by the service',
      required: false
    },
    where: {
      label: 'Where',
      type: 'object',
      description:
        'Non-numeric where values for data measurements such as: where someone logged into your service from',
      required: false
    },
    what: {
      label: 'What',
      type: 'object',
      description: 'Non-numeric what values for data measurements such as: what level of user logged into the service',
      required: false
    },
    other: {
      label: 'Other',
      type: 'object',
      description:
        'Non-numeric other values for measurements such as textual data which is not applicable to Who, What, or Where events',
      required: false
    },
    metadata: {
      label: 'Metadata',
      type: 'object',
      description:
        "Non-numeric metadata values for measurements using high-cardinality fields that you don't intend to segment when you aggregate the data",
      required: false
    },
    measure: {
      label: 'Measure',
      type: 'object',
      description: 'Numeric measure values for general quantitative measurements.',
      required: false
    },
    cost: {
      label: 'Cost',
      type: 'object',
      description: 'Numeric cost values for measurements associated with costs',
      required: false
    },
    income: {
      label: 'Income',
      type: 'object',
      description: 'Numeric income values for measurements associated with income',
      required: false
    },
    enable_batching: {
      type: 'boolean',
      label: 'Send data to m3ter in batches',
      description:
        'When enabled the action will send multiple events in a single API request, improving efficiency. This is m3ter’s recommended mode.',
      required: true,
      default: true
    }
  },
  perform: async (request, { settings, payload }) => {
    return submitMeasurements(request, settings.org_id, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return submitMeasurements(request, settings.org_id, payload)
  }
}

async function submitMeasurements(
  request: RequestClient,
  orgId: string,
  payload: Payload[]
): Promise<ModifiedResponse[]> {
  const batches = [...limitBatch(payload)]
  const requests = batches.map((batch) =>
    request(`${M3TER_INGEST_API}/organizations/${orgId}/measurements`, {
      method: 'post',
      json: { measurements: batch }
    })
  )
  return Promise.all(requests)
}

function* limitBatch<T>(arr: T[]): Generator<T[], void> {
  for (let index = 0; index < arr.length; index += MAX_MEASUREMENTS_PER_BATCH) {
    yield arr.slice(index, index + MAX_MEASUREMENTS_PER_BATCH)
  }
}

export default action
