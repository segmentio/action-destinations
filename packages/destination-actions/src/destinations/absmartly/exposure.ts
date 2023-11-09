import { InputField, ModifiedResponse, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { defaultEventFields, DefaultPayload, PublishRequestEvent, sendEvent } from './event'
import { Settings } from './generated-types'
import { isValidTimestamp, unixTimestampOf } from './timestamp'
import { Data } from 'ws'

export interface ExposurePayload extends DefaultPayload {
  exposedAt: string | number
  exposure: Record<string, unknown>
}

export const defaultExposureFields: Record<string, InputField> = {
  exposedAt: {
    label: 'Exposure Time',
    type: 'datetime',
    required: true,
    description:
      'Exact timestamp when the exposure was recorded. Must be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number',
    default: {
      '@path': '$.timestamp'
    }
  },
  exposure: {
    label: 'ABsmartly Exposure Payload',
    type: 'object',
    defaultObjectUI: 'object:only',
    required: true,
    description:
      'The ABsmartly exposure payload without any goals. Generated by the ABsmartly SDK and should not be modified.',
    default: {
      '@path': '$.properties.exposure'
    }
  },
  ...defaultEventFields
}

function isValidExposureRequest(
  exposure?: PublishRequestEvent | Record<string, unknown>
): exposure is PublishRequestEvent {
  if (exposure == null || typeof exposure != 'object') {
    return false
  }

  const publishedAt = exposure['publishedAt']
  if (!isValidTimestamp(publishedAt)) {
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

  if (exposures.some((x) => typeof x['exposedAt'] !== 'number' || !isValidTimestamp(x['exposedAt']))) {
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
  payload: ExposurePayload,
  settings: Settings
): Promise<ModifiedResponse<Data>> {
  if (!isValidTimestamp(payload.exposedAt)) {
    throw new PayloadValidationError(
      'Exposure `exposedAt` is required to be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number'
    )
  }

  const exposureRequest = payload.exposure as PublishRequestEvent
  if (exposureRequest == null || typeof exposureRequest != 'object') {
    throw new PayloadValidationError('Field `exposure` is required to be an object when tracking exposures')
  }

  if (!isValidExposureRequest(exposureRequest)) {
    throw new PayloadValidationError(
      'Field `exposure` is malformed or contains goals. Ensure you are sending a valid ABsmartly exposure payload without goals.'
    )
  }

  const publishedAt = unixTimestampOf(payload.exposedAt)
  const exposures = exposureRequest.exposures?.map((x) => ({
    ...x,
    exposedAt: publishedAt - (exposureRequest.publishedAt - x.exposedAt)
  }))
  const attributes = exposureRequest.attributes?.map((x) => ({
    ...x,
    setAt: publishedAt - (exposureRequest.publishedAt - x.setAt)
  }))

  return sendEvent(
    request,
    settings,
    {
      ...exposureRequest,
      historic: true,
      publishedAt,
      exposures,
      attributes
    },
    payload.agent,
    payload.application
  )
}
