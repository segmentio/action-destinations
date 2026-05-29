import type { SegmentEvent } from './segment-event'
import type { JSONValue } from './json-object'
import type { E2EEngageAudienceEventOptions } from './e2e-types'

export function createE2EEvent(
  type: SegmentEvent['type'],
  name: string,
  overrides?: Partial<Omit<SegmentEvent, 'type' | 'event' | 'messageId' | 'timestamp'>>
): SegmentEvent {
  return {
    type,
    event: name,
    messageId: '$guid',
    timestamp: '$now',
    ...overrides
  }
}

export function createE2EEngageAudienceEvent(options: E2EEngageAudienceEventOptions): SegmentEvent {
  const {
    type,
    action,
    computationKey,
    computationId,
    externalAudienceId,
    userId,
    anonymousId,
    email,
    audienceFields,
    enrichedTraits
  } = options

  const membership = action === 'add'

  const personas: Record<string, unknown> = {
    computation_class: 'audience',
    computation_key: computationKey,
    computation_id: computationId
  }

  if (externalAudienceId) {
    personas.external_audience_id = externalAudienceId
  }

  const context: Record<string, unknown> = { personas }

  if (audienceFields) {
    context.audienceFields = audienceFields
  }

  if (type === 'track') {
    const properties: { [k: string]: JSONValue } = {
      [computationKey]: membership,
      ...(enrichedTraits as { [k: string]: JSONValue })
    }

    if (email) {
      properties.email = email
      context.traits = { email }
    }

    return {
      type: 'track',
      event: computationKey,
      messageId: '$guid',
      timestamp: '$now',
      ...(userId && { userId }),
      ...(anonymousId && { anonymousId }),
      context,
      properties
    }
  }

  const traits: { [k: string]: JSONValue } = {
    [computationKey]: membership,
    ...(enrichedTraits as { [k: string]: JSONValue })
  }

  if (email) {
    traits.email = email
  }

  return {
    type: 'identify',
    messageId: '$guid',
    timestamp: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    context,
    traits
  }
}
