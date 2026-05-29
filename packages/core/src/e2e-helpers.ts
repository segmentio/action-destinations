import type { SegmentEvent } from './segment-event'
import type { JSONValue } from './json-object'
import type { E2EEngageAudienceEventOptions, E2EEngageAudienceEvent } from './e2e-types'

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

export function createE2EEngageAudienceEvent(options: E2EEngageAudienceEventOptions): E2EEngageAudienceEvent {
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

  return event as E2EEngageAudienceEvent
}
