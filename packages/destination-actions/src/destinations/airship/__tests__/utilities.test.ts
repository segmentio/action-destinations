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
})

describe('Testing _build_tags_object', () => {
  it('should correctly format a tag', () => {
    expect(_private._build_tags_object(valid_tags_payload)).toEqual(airship_tags_payload)
  })
})

describe('Testing validate_timestamp', () => {
  it('should correctly format a timestamo', () => {
    expect(_private.validate_timestamp(valid_custom_event_payload.occurred)).toEqual(
      occurred.toISOString().split('.')[0]
    )
  })
})

describe('Testing parse_date', () => {
  it('should parse a date into a date object', () => {
    expect(_private.parse_date('2023-05-09T00:47:43.378Z')).toBeInstanceOf(Date)
  })
})
