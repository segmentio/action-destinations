import { ExecuteInput, ModifiedResponse, RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { performSnapCAPIv3, performSnapCAPIv3Batch } from '../reportConversionEvent/snap-capi-v3'
import { mapEventName } from '../eventMapping'

export const performTrackEvent = async (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>
): Promise<ModifiedResponse<unknown>> => {
  // Map the event name if it's a standard Segment event
  const mappedPayload = {
    ...data.payload,
    event_name: data.payload.event_name || mapEventName(data.event?.event)
  }

  return performSnapCAPIv3(request, {
    ...data,
    payload: mappedPayload
  })
}

export const performTrackEventBatch = async (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload[]>
): Promise<ModifiedResponse<unknown>> => {
  // Map event names for all events in the batch
  const mappedPayloads = data.payload.map((payload, index) => ({
    ...payload,
    event_name: payload.event_name || mapEventName(data.events?.[index]?.event)
  }))

  return performSnapCAPIv3Batch(request, {
    ...data,
    payload: mappedPayloads
  })
}