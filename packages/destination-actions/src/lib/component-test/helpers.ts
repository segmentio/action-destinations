// Event builders for component test fixtures. Ported from action-destinations PR #3829 (was in
// packages/core); kept outside core alongside the component test framework. SegmentEvent / JSONValue
// come from the published core package.
import type { SegmentEvent, JSONValue } from '@segment/actions-core'
import type {
  CTAudienceEventBase,
  CTEngageAudienceEventOptions,
  CTEngageAudienceEvent,
  CTJourneysV1AudienceEventOptions,
  CTJourneysV1AudienceTrackEvent,
  CTJourneysV2AudienceEventOptions,
  CTJourneysV2AudienceTrackEvent,
  CTRetlAudienceEventOptions,
  CTRetlAudienceTrackEvent
} from './types'

/*
 * Regular Segment Connections event
 */
export function createCTEvent(
  type: SegmentEvent['type'],
  name?: string,
  overrides?: Partial<Omit<SegmentEvent, 'type' | 'event' | 'name' | 'messageId' | 'timestamp'>>
): SegmentEvent {
  if (type === 'track') {
    return {
      type,
      event: name,
      messageId: '$guid',
      timestamp: '$now',
      receivedAt: '$now',
      ...overrides
    }
  }

  if (type === 'page' || type === 'screen') {
    return {
      type,
      name,
      messageId: '$guid',
      timestamp: '$now',
      receivedAt: '$now',
      ...overrides
    }
  }

  if (name) {
    throw new Error(
      `createCTEvent: "name" is not supported for "${type}" events. Only track, page, and screen accept a name.`
    )
  }

  return {
    type,
    messageId: '$guid',
    timestamp: '$now',
    receivedAt: '$now',
    ...overrides
  }
}

function buildAudienceEventBase(options: CTAudienceEventBase) {
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
    receivedAt: '$now',
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
export function createCTEngageAudienceEvent<ComputationKey extends string>(
  options: CTEngageAudienceEventOptions<ComputationKey>
): CTEngageAudienceEvent<ComputationKey> {
  const { type, action, computationKey, eventName, email, enrichedTraits } = options

  if (type === 'identify' && eventName) {
    throw new Error('createCTEngageAudienceEvent: "eventName" is not supported for identify events.')
  }

  const membership = action === 'add'
  const base = buildAudienceEventBase({ ...options, includeContextTraits: type === 'track' })

  const event = {
    ...base,
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

  return event as CTEngageAudienceEvent<ComputationKey>
}

/*
 * Journeys V1 events (preset journeys_step_entered_track) do not have properties[<computation_key>] value.
 * All Journeys V1 events enter the user to the audience, never remove them.
 * Only track events supported
 */
export function createCTJourneysV1AudienceEvent<ComputationKey extends string>(
  options: CTJourneysV1AudienceEventOptions<ComputationKey>
): CTJourneysV1AudienceTrackEvent<ComputationKey> {
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
    receivedAt: '$now',
    ...(userId && { userId }),
    ...(anonymousId && { anonymousId }),
    type: 'track',
    event: 'Audience Entered',
    properties: {
      ...(enrichedTraits as { [k: string]: JSONValue })
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

  return event as CTJourneysV1AudienceTrackEvent<ComputationKey>
}

/*
 * Journeys V2 events use computation_class 'journey_step' (not 'audience') and carry
 * journey_context / journey_metadata in properties alongside properties[<computation_key>],
 * the membership boolean (true = entering the step / add, false = exiting / remove).
 * Only track events supported.
 */
export function createCTJourneysV2AudienceEvent<ComputationKey extends string>(
  options: CTJourneysV2AudienceEventOptions<ComputationKey>
): CTJourneysV2AudienceTrackEvent<ComputationKey> {
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
    receivedAt: '$now',
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
      ...(enrichedTraits as { [k: string]: JSONValue })
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

  return event as CTJourneysV2AudienceTrackEvent<ComputationKey>
}

/*
 * Reverse ETL Audience event
 * Same payload structure as Engage track events but uses RETL-specific event names: 'new', 'updated', 'deleted'
 * Only track events supported
 */
export function createCTRetlAudienceEvent<ComputationKey extends string>(
  options: CTRetlAudienceEventOptions<ComputationKey>
): CTRetlAudienceTrackEvent<ComputationKey> {
  const { eventName, enrichedTraits } = options
  const base = buildAudienceEventBase(options)

  const event = {
    ...base,
    type: 'track',
    event: eventName,
    properties: {
      ...(enrichedTraits as { [k: string]: JSONValue })
    }
  }

  return event as CTRetlAudienceTrackEvent<ComputationKey>
}
