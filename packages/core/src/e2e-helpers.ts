import type { SegmentEvent } from './segment-event'
import type { JSONValue } from './json-object'
import type { E2EEngageAudienceEventOptions, E2EEngageAudienceEvent, E2EJourneysV1AudienceEventOptions, E2EJourneysV1AudienceTrackEvent, E2ERetlAudienceEventOptions, E2ERetlAudienceTrackEvent } from './e2e-types'

/*
 * Regular Segment Connections event  
 */
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

/* 
 * Engage Audience event
 * Supports identify and track events
 */
export function createE2EEngageAudienceEvent<ComputationKey extends string>(options: E2EEngageAudienceEventOptions<ComputationKey>): E2EEngageAudienceEvent<ComputationKey> {
  const { type, action, computationKey, computationId, externalAudienceId, eventName, userId, anonymousId, email, audienceFields, enrichedTraits } = options
  const membership = action === 'add'

  const event = {
    messageId: '$guid',
    timestamp: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: computationKey,
        computation_id: computationId,
        ...(externalAudienceId && { external_audience_id: externalAudienceId })
      },
      ...(audienceFields && { audienceFields }),
      ...(type === 'track' && email && { traits: { email } })
    },
    ...(type === 'track' && {
      type: 'track',
      event: eventName ?? 'Test Engage Audience Membership Event',
      properties: {
        [computationKey]: membership,
        ...(enrichedTraits as { [k: string]: JSONValue })
      }
    }),
    ...(type === 'identify' && {
      type: 'identify',
      traits: {
        [computationKey]: membership,
        ...(enrichedTraits as { [k: string]: JSONValue }),
        ...(email && { email })
      }
    })
  }

  return event as E2EEngageAudienceEvent<ComputationKey>
}

/* 
 * Journeys V1 events (preset journeys_step_entered_track) do not have properties[<computation_key>] value. 
 * All Journeys V1 events enter the user to the audience, never remove them. 
 * Only track events supported
 */
export function createE2EJourneysV1AudienceEvent<ComputationKey extends string>(options: E2EJourneysV1AudienceEventOptions<ComputationKey>): E2EJourneysV1AudienceTrackEvent<ComputationKey> {
  const { computationKey, computationId, externalAudienceId, eventName, userId, anonymousId, email, audienceFields, enrichedTraits } = options

  const event = {
    messageId: '$guid',
    timestamp: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: computationKey,
        computation_id: computationId,
        ...(externalAudienceId && { external_audience_id: externalAudienceId })
      },
      ...(audienceFields && { audienceFields }),
      ...(email && { traits: { email } })
    },
    type: 'track',
    event: eventName ?? 'Test Journeys V1 Audience Membership Event',
    properties: {
      ...(enrichedTraits as { [k: string]: JSONValue })
    }
  }

  return event as E2EJourneysV1AudienceTrackEvent<ComputationKey>
}

/*
 * Reverse ETL Audience event
 * Same payload structure as Engage track events but uses RETL-specific event names: 'new', 'updated', 'deleted'
 * Only track events supported
 */
export function createE2ERetlAudienceEvent<ComputationKey extends string>(options: E2ERetlAudienceEventOptions<ComputationKey>): E2ERetlAudienceTrackEvent<ComputationKey> {
  const { eventName, computationKey, computationId, externalAudienceId, userId, anonymousId, email, audienceFields, enrichedTraits } = options
  const membership = eventName !== 'deleted'

  const event = {
    messageId: '$guid',
    timestamp: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: computationKey,
        computation_id: computationId,
        ...(externalAudienceId && { external_audience_id: externalAudienceId })
      },
      ...(audienceFields && { audienceFields }),
      ...(email && { traits: { email } })
    },
    type: 'track',
    event: eventName,
    properties: {
      [computationKey]: membership,
      ...(enrichedTraits as { [k: string]: JSONValue })
    }
  }

  return event as E2ERetlAudienceTrackEvent<ComputationKey>
}
