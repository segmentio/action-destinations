import type { SegmentEvent } from './segment-event'
import type {
  E2EAudienceEventBase,
  E2EEngageAudienceEventOptions,
  E2EEngageAudienceEvent,
  E2EJourneysV1AudienceEventOptions,
  E2EJourneysV1AudienceTrackEvent,
  E2EJourneysV2AudienceEventOptions,
  E2EJourneysV2AudienceTrackEvent,
  E2ERetlAudienceEventOptions,
  E2ERetlAudienceTrackEvent
} from './e2e-types'

type E2EEventOverrides = Partial<Omit<SegmentEvent, 'type' | 'event' | 'name' | 'messageId' | 'timestamp'>>

/*
 * Regular Segment Connections event.
 *
 * Overloads enforce the name rules at the type level:
 * - track: name required (becomes the event name)
 * - page/screen: name optional
 * - identify/group/alias: no name accepted
 */
export function createE2EEvent(type: 'track', name: string, overrides?: E2EEventOverrides): SegmentEvent
export function createE2EEvent(type: 'page' | 'screen', name?: string, overrides?: E2EEventOverrides): SegmentEvent
export function createE2EEvent(
  type: 'identify' | 'group' | 'alias',
  name?: undefined,
  overrides?: E2EEventOverrides
): SegmentEvent
export function createE2EEvent(type: SegmentEvent['type'], name?: string, overrides?: E2EEventOverrides): SegmentEvent {
  if (type === 'track') {
    return {
      type,
      event: name,
      messageId: '$guid',
      timestamp: '$now',
      ...overrides
    }
  }

  if (type === 'page' || type === 'screen') {
    return {
      type,
      name,
      messageId: '$guid',
      timestamp: '$now',
      ...overrides
    }
  }

  if (name) {
    throw new Error(
      `createE2EEvent: "name" is not supported for "${type}" events. Only track, page, and screen accept a name.`
    )
  }

  return {
    type,
    messageId: '$guid',
    timestamp: '$now',
    ...overrides
  }
}

function buildAudienceEventBase(options: E2EAudienceEventBase) {
  const {
    computationKey,
    computationId,
    externalAudienceId,
    userId,
    anonymousId,
    email,
    audienceFields,
    includeContextTraits = true
  } = options
  return {
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
      ...(includeContextTraits && email && { traits: { email } })
    }
  }
}

/*
 * Engage Audience event
 * Supports identify and track events
 */
export function createE2EEngageAudienceEvent<ComputationKey extends string>(
  options: E2EEngageAudienceEventOptions<ComputationKey>
): E2EEngageAudienceEvent<ComputationKey> {
  const { action, computationKey, email, enrichedTraits } = options
  const membership = action === 'add'
  const base = buildAudienceEventBase({ ...options, includeContextTraits: options.type === 'track' })

  if (options.type === 'track') {
    return {
      ...base,
      type: 'track',
      event: options.eventName ?? 'Test Engage Audience Membership Event',
      properties: {
        [computationKey]: membership,
        ...enrichedTraits
      }
    } as E2EEngageAudienceEvent<ComputationKey>
  }

  return {
    ...base,
    type: 'identify',
    traits: {
      [computationKey]: membership,
      ...enrichedTraits,
      ...(email && { email })
    }
  } as E2EEngageAudienceEvent<ComputationKey>
}

/*
 * Journeys V1 events (preset journeys_step_entered_track) do not have properties[<computation_key>] value.
 * All Journeys V1 events enter the user to the audience, never remove them.
 * Only track events supported
 */
export function createE2EJourneysV1AudienceEvent<ComputationKey extends string>(
  options: E2EJourneysV1AudienceEventOptions<ComputationKey>
): E2EJourneysV1AudienceTrackEvent<ComputationKey> {
  const {
    computationKey,
    computationId,
    externalAudienceId,
    userId,
    anonymousId,
    email,
    audienceFields,
    enrichedTraits
  } = options

  const event = {
    messageId: '$guid',
    timestamp: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    type: 'track',
    event: 'Audience Entered',
    properties: {
      ...enrichedTraits
    },
    context: {
      personas: {
        computation_class: 'journey_step',
        computation_key: computationKey,
        computation_id: computationId,
        ...(externalAudienceId && { external_audience_id: externalAudienceId })
      },
      ...(audienceFields && { audienceFields }),
      ...(email && { traits: { email } })
    }
  }

  return event as E2EJourneysV1AudienceTrackEvent<ComputationKey>
}

/*
 * Journeys V2 events use computation_class 'journey_step' (not 'audience') and carry
 * journey_context / journey_metadata in properties alongside properties[<computation_key>],
 * the membership boolean (true = entering the step / add, false = exiting / remove).
 * Only track events supported.
 */
export function createE2EJourneysV2AudienceEvent<ComputationKey extends string>(
  options: E2EJourneysV2AudienceEventOptions<ComputationKey>
): E2EJourneysV2AudienceTrackEvent<ComputationKey> {
  const {
    action = 'add',
    computationKey,
    computationId,
    externalAudienceId,
    eventName,
    journeyId,
    journeyName,
    userId,
    anonymousId,
    email,
    audienceFields,
    enrichedTraits
  } = options

  const membership = action === 'add'

  const event = {
    messageId: '$guid',
    timestamp: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    type: 'track',
    event: eventName ?? 'Test Journeys V2 Audience Membership Event',
    properties: {
      [computationKey]: membership,
      journey_context: {
        [computationKey]: {}
      },
      journey_metadata: {
        epoch_id: '$guid',
        journey_id: journeyId ?? 'jver_e2e_journey',
        journey_name: journeyName ?? 'e2e journey'
      },
      ...enrichedTraits
    },
    context: {
      personas: {
        computation_class: 'journey_step',
        computation_key: computationKey,
        computation_id: computationId,
        ...(externalAudienceId && { external_audience_id: externalAudienceId })
      },
      ...(audienceFields && { audienceFields }),
      ...(email && { traits: { email } })
    }
  }

  return event as E2EJourneysV2AudienceTrackEvent<ComputationKey>
}

/*
 * Reverse ETL Audience event
 * Same payload structure as Engage track events but uses RETL-specific event names: 'new', 'updated', 'deleted'
 * Only track events supported
 */
export function createE2ERetlAudienceEvent<ComputationKey extends string>(
  options: E2ERetlAudienceEventOptions<ComputationKey>
): E2ERetlAudienceTrackEvent<ComputationKey> {
  const { eventName, computationKey, enrichedTraits } = options
  const membership = eventName !== 'deleted'
  const base = buildAudienceEventBase(options)

  const event = {
    ...base,
    type: 'track',
    event: eventName,
    properties: {
      [computationKey]: membership,
      ...enrichedTraits
    }
  }

  return event as E2ERetlAudienceTrackEvent<ComputationKey>
}
