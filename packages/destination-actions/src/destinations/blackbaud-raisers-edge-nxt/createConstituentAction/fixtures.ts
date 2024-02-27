import { SegmentEvent } from '@segment/actions-core'

// track events
export const trackEventData: Partial<SegmentEvent> = {
  type: 'track',
  properties: {
    constituentId: '123',
    category: 'Task/Other'
  },
  timestamp: '2022-12-12T19:11:01.249Z'
}

export const trackEventDataNewConstituent: Partial<SegmentEvent> = {
  type: 'track',
  properties: {
    email: 'john@example.biz',
    emailType: 'Personal',
    firstName: 'John',
    lastName: 'Doe',
    category: 'Task/Other'
  },
  timestamp: '2022-12-12T19:11:01.249Z'
}

export const trackEventDataNoConstituent: Partial<SegmentEvent> = {
  type: 'track',
  properties: {
    category: 'Task/Other'
  },
  timestamp: '2022-12-12T19:11:01.249Z'
}
