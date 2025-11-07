import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api'
}

const payload = {
  type: 'identify',
  userId: 'x_id',
  anonymousId: 'anon_id',
  traits: {
    email: 'test@test.com',
    list_id: 'list_id',
    first_name: 'Jimmyjoe',
    last_name: 'Doe',
    phone: '+1234567890',
    birthday: '1990-01-01',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postal_code: '12345',
      country: 'USA'
    },
    tags_to_add: ['tag1', 'tag2'],
    tags_to_remove: ['tag3'],
    consented: true
  },
  timestamp: '2023-10-01T00:00:00Z',
  context: {
    ip: '127.0.0.1',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
    page: {
      url: 'https://example.com/page',
      title: 'Example Page',
      referrer: 'https://google.com',
      path: '/page',
      search: '?query=1'
    },
    campaign: {
      name: 'Summer Sale',
      source: 'Newsletter',
      medium: 'Email',
      term: 'summer',
      content: 'toplink'
    },
    location: {
      country: 'USA',
      region: 'California',
      city: 'San Francisco'
    }
  }
} as Partial<SegmentEvent>

const mapping = {
  identifiers: {
    userId: { '@path': '$.userId' },
    anonymousId: { '@path': '$.anonymousId' },
    email: { '@path': '$.traits.email' }
  },
  listId: { '@path': '$.traits.list_id' },
  timestamp: { '@path': '$.timestamp' },
  ip: { '@path': '$.context.ip' },
  userAgent: { '@path': '$.context.userAgent' },
  page: {
    title: { '@path': '$.context.page.title' },
    url: { '@path': '$.context.page.url' },
    referrer: { '@path': '$.context.page.referrer' },
    path: { '@path': '$.context.page.path' },
    search: { '@path': '$.context.page.search' }
  },
  campaign: {
    name: { '@path': '$.context.campaign.name' },
    source: { '@path': '$.context.campaign.source' },
    medium: { '@path': '$.context.campaign.medium' },
    term: { '@path': '$.context.campaign.term' },
    content: { '@path': '$.context.campaign.content' }
  },
  location: {
    country: { '@path': '$.context.location.country' },
    region: { '@path': '$.context.location.region' },
    city: { '@path': '$.context.location.city' }
  },
  properties: {
    firstName: { '@path': '$.traits.first_name' },
    lastName: { '@path': '$.traits.last_name' },
    phone: { '@path': '$.traits.phone' },
    dateOfBirth: { '@path': '$.traits.birthday' },
    address: { '@path': '$.traits.address.street' },
    city: { '@path': '$.traits.address.city' },
    state: { '@path': '$.traits.address.state' },
    country: { '@path': '$.traits.address.country' },
    zipcode: { '@path': '$.traits.address.postal_code' }
  },
  status: { '@path': '$.traits.consented' },
  tags_to_add: { '@path': '$.traits.tags_to_add' },
  tags_to_remove: { '@path': '$.traits.tags_to_remove' }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Yonoma', () => {
  describe('upsertContact', () => {
    it('should send an upsertContact payload to Yonoma', async () => {
      const event = createTestEvent(payload)

      const jsonUpsertContact = {
        userId: 'x_id',
        anonymousId: 'anon_id',
        email: 'test@test.com',
        listId: 'list_id',
        status: true,
        timestamp: '2023-10-01T00:00:00Z',
        ip: '127.0.0.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        page: {
          title: 'Example Page',
          url: 'https://example.com/page',
          referrer: 'https://google.com',
          path: '/page',
          search: '?query=1'
        },
        campaign: {
          name: 'Summer Sale',
          source: 'Newsletter',
          medium: 'Email',
          term: 'summer',
          content: 'toplink'
        },
        location: {
          country: 'USA',
          region: 'California',
          city: 'San Francisco'
        },
        properties: {
          firstName: 'Jimmyjoe',
          lastName: 'Doe',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          zipcode: '12345',
          tags_to_add: ['tag1', 'tag2'],
          tags_to_remove: ['tag3']
        }
      }
      nock('https://api.yonoma.io').post('/integration/segment/upsertcontact', jsonUpsertContact).reply(200, {})

      const response = await testDestination.testAction('upsertContact', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response.length).toBe(1)
    })

    it('upsertContact should handle birthday with ISO8601 format', async () => {
      const payloadWithIsoBirthday = {
        ...payload,
        traits: {
          ...payload.traits,
          birthday: '1990-01-01T10:05:00Z' // ISO8601 format
        }
      }

      const event = createTestEvent(payloadWithIsoBirthday)

      const jsonUpsertContact = {
        userId: 'x_id',
        anonymousId: 'anon_id',
        email: 'test@test.com',
        listId: 'list_id',
        status: true,
        timestamp: '2023-10-01T00:00:00Z',
        ip: '127.0.0.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        page: {
          title: 'Example Page',
          url: 'https://example.com/page',
          referrer: 'https://google.com',
          path: '/page',
          search: '?query=1'
        },
        campaign: {
          name: 'Summer Sale',
          source: 'Newsletter',
          medium: 'Email',
          term: 'summer',
          content: 'toplink'
        },
        location: {
          country: 'USA',
          region: 'California',
          city: 'San Francisco'
        },
        properties: {
          firstName: 'Jimmyjoe',
          lastName: 'Doe',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          zipcode: '12345',
          tags_to_add: ['tag1', 'tag2'],
          tags_to_remove: ['tag3']
        }
      }
      nock('https://api.yonoma.io').post('/integration/segment/upsertcontact', jsonUpsertContact).reply(200, {})

      const response = await testDestination.testAction('upsertContact', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response.length).toBe(1)
    })
  })
})
