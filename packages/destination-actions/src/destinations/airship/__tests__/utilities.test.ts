import { _private } from '../utilities'
import { Payload as CustomEventsPayload } from '../customEvents/generated-types'
import { Payload as AttributesPayload } from '../setAttributes/generated-types'
import { Payload as ManageTagsPayload } from '../manageTags/generated-types'

const occurred = new Date()

const valid_custom_event_payload: CustomEventsPayload = {
  named_user_id: 'test-user-d7h0ysir6l',
  name: 'Segment Test Event Name',
  occurred: occurred.toISOString(),
  properties: {
    property1: 1,
    property2: 'test',
    property3: true
  },
  enable_batching: false
}

const valid_attributes_payload: AttributesPayload = {
  named_user_id: 'test-user-rzoj4u7gqw',
  occurred: occurred.toISOString(),
  attributes: {
    trait1: 1,
    trait2: 'test',
    trait3: true,
    birthdate: '1965-01-25T00:47:43.378Z'
  }
}

const valid_tags_payload: ManageTagsPayload = {
  named_user_id: 'test-user-fo3e6qa1sq',
  tag_group: 'segment-integration',
  tags: {
    trait1: 1,
    trait2: 'test',
    trait3: true
  }
}

const airship_custom_event_payload = {
  occurred: occurred.toISOString().split('.')[0],
  user: { named_user_id: 'test-user-d7h0ysir6l' },
  body: {
    name: 'segment test event name',
    interaction_type: 'cdp',
    properties: {
      property1: 1,
      property2: 'test',
      property3: true,
      source: 'Segment'
    }
  }
}

const airship_attributes_payload = [
  {
    action: 'set',
    key: 'trait1',
    timestamp: occurred.toISOString().split('.')[0],
    value: 1
  },
  {
    action: 'set',
    key: 'trait2',
    timestamp: occurred.toISOString().split('.')[0],
    value: 'test'
  },
  {
    action: 'set',
    key: 'trait3',
    timestamp: occurred.toISOString().split('.')[0],
    value: true
  },
  {
    action: 'set',
    key: 'birthdate',
    timestamp: occurred.toISOString().split('.')[0],
    value: '1965-01-25T00:47:43'
  }
]

const airship_tags_payload = {
  add: {
    'segment-integration': ['trait3']
  },
  audience: {
    named_user_id: 'test-user-fo3e6qa1sq'
  }
}

describe('Testing _build_custom_event_object', () => {
  it('should correctly format a custom event', () => {
    expect(_private._build_custom_event_object(valid_custom_event_payload)).toEqual(airship_custom_event_payload)
  })
})

describe('Testing _build_attribute_object', () => {
  it('should correctly format an attribute', () => {
    expect(_private._build_attributes_object(valid_attributes_payload)).toEqual(airship_attributes_payload)
  })

  it('should NOT parse non-date string attributes as dates', () => {
    const payload: AttributesPayload = {
      named_user_id: 'test-user',
      occurred: occurred.toISOString(),
      attributes: {
        shop_last_store_name: 'SOUMAGNE 2',
        shop_visited_store_names: 'BARCHON | HOGNOUL | JEMEPPE | SOUMAGNE 2',
        shop_last_store_id: '30290'
      }
    }
    const result = _private._build_attributes_object(payload)

    // These should remain as strings, not be converted to dates
    const shopNameAttr = result.find((attr: any) => attr.key === 'shop_last_store_name')
    expect(shopNameAttr?.value).toBe('SOUMAGNE 2')

    const shopNamesAttr = result.find((attr: any) => attr.key === 'shop_visited_store_names')
    expect(shopNamesAttr?.value).toBe('BARCHON | HOGNOUL | JEMEPPE | SOUMAGNE 2')

    const shopIdAttr = result.find((attr: any) => attr.key === 'shop_last_store_id')
    expect(shopIdAttr?.value).toBe('30290')
  })

  it('should still parse date-like strings as dates', () => {
    const payload: AttributesPayload = {
      named_user_id: 'test-user',
      occurred: occurred.toISOString(),
      attributes: {
        birthdate: '1965-01-25T00:47:43.378Z',
        account_creation: '2023-05-09T00:47:43.378Z',
        custom_date_field: '2025-06-11',
        another_date: '01/25/1965'
      }
    }
    const result = _private._build_attributes_object(payload)

    const birthdateAttr = result.find((attr: any) => attr.key === 'birthdate')
    expect(birthdateAttr?.value).toBe('1965-01-25T00:47:43')

    const accountCreationAttr = result.find((attr: any) => attr.key === 'account_creation')
    expect(accountCreationAttr?.value).toBe('2023-05-09T00:47:43')

    const customDateAttr = result.find((attr: any) => attr.key === 'custom_date_field')
    // The date '2025-06-11' is parsed in local timezone, so the resulting UTC date may be
    // 2025-06-10 or 2025-06-11 depending on the timezone where tests run
    expect(customDateAttr?.value).toMatch(/2025-06-1[012]/)

    const anotherDateAttr = result.find((attr: any) => attr.key === 'another_date')
    // The date '01/25/1965' is parsed in local timezone, so the resulting UTC date may be
    // 1965-01-24 or 1965-01-25 or 1965-01-26 depending on the timezone where tests run
    expect(anotherDateAttr?.value).toMatch(/1965-01-2[456]/)
  })
})

describe('Testing _build_tags_object', () => {
  it('should correctly format a tag', () => {
    expect(_private._build_tags_object(valid_tags_payload)).toEqual(airship_tags_payload)
  })
})

describe('Testing _validate_timestamp', () => {
  it('should correctly format a timestamo', () => {
    expect(_private._validate_timestamp(valid_custom_event_payload.occurred)).toEqual(
      occurred.toISOString().split('.')[0]
    )
  })
})

describe('Testing _parse_date', () => {
  it('should parse a date into a date object', () => {
    expect(_private._parse_date('2023-05-09T00:47:43.378Z')).toBeInstanceOf(Date)
  })
})

describe('Testing _parse_date', () => {
  it('should NOT parse a short string into a date object', () => {
    expect(_private._parse_date('30122')).toBeNull()
  })
})

describe('Testing _parse_date', () => {
  it('should parse a date-looking string into a date object', () => {
    expect(_private._parse_date('2025-06-11')).toBeInstanceOf(Date)
  })

  it('should NOT parse strings without date-like patterns', () => {
    expect(_private._parse_date('SOUMAGNE 2')).toBeNull()
    expect(_private._parse_date('BARCHON | HOGNOUL | JEMEPPE | SOUMAGNE 2')).toBeNull()
    expect(_private._parse_date('30290')).toBeNull()
    expect(_private._parse_date('SOUMAGNE')).toBeNull()
  })

  it('should parse valid date formats', () => {
    expect(_private._parse_date('2023-05-09T00:47:43.378Z')).toBeInstanceOf(Date)
    expect(_private._parse_date('2025-06-11')).toBeInstanceOf(Date)
    expect(_private._parse_date('01/25/1965')).toBeInstanceOf(Date)
    expect(_private._parse_date('1965-01-25')).toBeInstanceOf(Date)
  })
})

describe('Testing _parse_and_format_date', () => {
  it('should modify a valid date string', () => {
    expect(_private._parse_and_format_date('2023-05-09T00:47:43.378Z')).toEqual('2023-05-09T00:47:43')
  })
})

describe('Testing _parse_and_format_date', () => {
  it('should return the original string', () => {
    expect(_private._parse_and_format_date('foo')).toEqual('foo')
  })
})
