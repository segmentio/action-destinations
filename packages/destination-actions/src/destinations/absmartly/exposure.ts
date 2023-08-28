import { InputField, ModifiedResponse, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { PublishRequestEvent, sendEvent } from './event'
import { TrackPayload } from './goal'
import { Settings } from './generated-types'
import { isValidTimestamp, unixTimestampOf } from './timestamp'
import { Data } from 'ws'

export const defaultExposureFields: Record<string, InputField> = {
  exposuresTracking: {
    label: 'Track Exposures',
    type: 'boolean',
    required: false,
    description:
      'Forward experiment exposure events tracked through Segment.io to ABsmartly. Useful if you want to replace the direct flow of exposure events from the ABsmartly SDK to the ABsmartly collector, by instead sending them to Segment.io for processing by the destination action.',
    default: false
  },
  exposureEventName: {
    label: 'Exposure Event Name',
    type: 'string',
    required: false,
    description:
      'The event name which should be forwarded to ABsmartly as an exposure instead of a goal when Track Exposures is on, or to be ignored when Track Exposures is off.',
    default: 'Experiment Viewed'
  },
  exposure: {
    label: 'ABsmartly Exposure Payload',
    type: 'object',
    defaultObjectUI: 'object:only',
    required: false,
    description: 'The verbatim ABsmartly exposure payload. Required when Track Exposures is on.',
    default: {
      '@path': '$.properties.exposure'
    }
  }
}

function isValidExposure(exposure?: PublishRequestEvent | Record<string, unknown>): exposure is PublishRequestEvent {
  if (exposure == null || typeof exposure != 'object') {
    return false
  }

  const units = exposure['units']
  if (!Array.isArray(units) || units.length == 0) {
    return false
  }

  const exposures = exposure['exposures']
  if (!Array.isArray(exposures) || exposures.length === 0) {
    return false
  }

  const goals = exposure['goals']
  if (goals != null && (!Array.isArray(goals) || goals.length > 0)) {
    return false
  }

  const attributes = exposure['attributes']
  if (attributes != null && !Array.isArray(attributes)) {
    return false
  }

  return true
}

export function sendExposure(
  request: RequestClient,
  payload: TrackPayload,
  settings: Settings
): Promise<ModifiedResponse<Data>> {
  if (!isValidTimestamp(payload.publishedAt)) {
    throw new PayloadValidationError(
      'Goal `publishedAt` is required to be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number'
    )
  }

  const exposure = payload.exposure
  if (exposure == null || typeof exposure != 'object') {
    throw new PayloadValidationError('Goal `exposure` is required to be an object when tracking exposures')
  }

  if (!isValidExposure(exposure)) {
    throw new PayloadValidationError(
      'Goal `exposure` is malformed or contains goals. Ensure you are sending a valid ABsmartly exposure payload without goals.'
    )
  }

  return sendEvent(
    request,
    settings,
    {
      ...exposure,
      publishedAt: unixTimestampOf(payload.publishedAt)
    },
    payload.agent,
    payload.application
  )
}
