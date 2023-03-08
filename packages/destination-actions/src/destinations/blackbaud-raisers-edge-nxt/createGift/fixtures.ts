import { SegmentEvent } from '@segment/actions-core'

// track events
export const trackEventData: Partial<SegmentEvent> = {
  type: 'track',
  properties: {
    constituentId: '123',
    fundId: '1',
    paymentMethod: 'CreditCard',
    revenue: 100
  }
}

export const trackEventDataNewConstituent: Partial<SegmentEvent> = {
  type: 'track',
  properties: {
    email: 'john@example.biz',
    emailType: 'Personal',
    firstName: 'John',
    lastName: 'Doe',
    fundId: '1',
    paymentMethod: 'CreditCard',
    revenue: 100
  }
}

export const trackEventDataNoConstituent: Partial<SegmentEvent> = {
  type: 'track',
  properties: {
    fundId: '1',
    paymentMethod: 'CreditCard',
    revenue: 100
  }
}

// gift data
export const giftPayload = {
  amount: {
    value: 100
  },
  constituent_id: '123',
  gift_splits: [
    {
      amount: {
        value: 100
      },
      fund_id: '1'
    }
  ],
  payments: [
    {
      payment_method: 'CreditCard'
    }
  ]
}

// constituent data
export const constituentPayload = {
  email: {
    address: 'john@example.biz',
    type: 'Personal'
  },
  first: 'John',
  last: 'Doe'
}
