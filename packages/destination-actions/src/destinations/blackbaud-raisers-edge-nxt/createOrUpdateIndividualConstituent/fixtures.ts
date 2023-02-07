import { SegmentEvent } from '@segment/actions-core'

// identify events
export const identifyEventData: Partial<SegmentEvent> = {
  type: 'identify',
  traits: {
    address: {
      city: 'New York City',
      postal_code: '10108',
      state: 'NY',
      street: 'PO Box 963'
    },
    address_type: 'Home',
    email: 'john@example.biz',
    email_type: 'Personal',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+18774466722',
    phone_type: 'Home',
    website: 'https://www.facebook.com/john.doe',
    website_type: 'Facebook'
  }
}

export const identifyEventDataNoEmail: Partial<SegmentEvent> = {
  type: 'identify',
  traits: {
    first_name: 'John',
    last_name: 'Doe',
    phone: '+18774466722',
    phone_type: 'Home'
  }
}

export const identifyEventDataNoLastName: Partial<SegmentEvent> = {
  type: 'identify',
  traits: {
    email: 'john@example.org'
  }
}

export const identifyEventDataUpdated: Partial<SegmentEvent> = {
  ...identifyEventData,
  traits: {
    ...identifyEventData.traits,
    address: {
      city: 'New York',
      postal_code: '10005',
      state: 'NY',
      street: '11 Wall St'
    },
    address_type: 'Work',
    email_type: 'Work',
    phone: '+18774466723',
    phone_type: 'Work',
    website: 'https://www.example.biz',
    website_type: 'Website'
  }
}

export const identifyEventDataWithLookupId: Partial<SegmentEvent> = {
  ...identifyEventDataUpdated,
  traits: {
    ...identifyEventDataUpdated.traits,
    address: {
      ...(typeof identifyEventDataUpdated.traits?.address === 'object' ? identifyEventDataUpdated.traits.address : {}),
      street: '11 Wall Street'
    },
    birthday: '2001-01-01T01:01:01-05:00',
    email: 'john.doe@aol.com',
    email_type: 'Personal',
    lookup_id: 'abcd1234'
  }
}

export const identifyEventDataWithInvalidWebsite: Partial<SegmentEvent> = {
  ...identifyEventDataUpdated,
  traits: {
    ...identifyEventDataUpdated.traits,
    website_type: 'Invalid'
  }
}

// constituent data
export const constituentPayload = {
  address: {
    address_lines: 'PO Box 963',
    city: 'New York City',
    state: 'NY',
    postal_code: '10108',
    type: 'Home'
  },
  email: {
    address: 'john@example.biz',
    type: 'Personal'
  },
  first: 'John',
  last: 'Doe',
  online_presence: {
    address: 'https://www.facebook.com/john.doe',
    type: 'Facebook'
  },
  phone: {
    number: '+18774466722',
    type: 'Home'
  },
  type: 'Individual'
}

export const constituentPayloadNoEmail = {
  first: 'John',
  last: 'Doe',
  phone: {
    number: '+18774466722',
    type: 'Home'
  },
  type: 'Individual'
}

export const constituentPayloadWithLookupId = {
  birthdate: {
    d: '1',
    m: '1',
    y: '2001'
  },
  first: 'John',
  last: 'Doe',
  lookup_id: 'abcd1234'
}

// address data
export const addressPayloadUpdated = {
  address_lines: '11 Wall St',
  city: 'New York',
  state: 'NY',
  postal_code: '10005',
  type: 'Work'
}

export const addressPayloadWithUpdatedStreet = {
  address_lines: '11 Wall Street',
  city: 'New York',
  state: 'NY',
  postal_code: '10005',
  type: 'Work'
}

// email data
export const emailPayloadUpdated = {
  address: 'john@example.biz',
  type: 'Work'
}

export const emailPayloadPersonal = {
  address: 'john.doe@aol.com',
  type: 'Personal'
}

// online presence data
export const onlinePresencePayloadUpdated = {
  address: 'https://www.example.biz',
  type: 'Website'
}

// phone data
export const phonePayloadUpdated = {
  number: '+18774466723',
  type: 'Work'
}
