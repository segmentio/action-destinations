import type { SegmentEvent } from './segment-event'

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
