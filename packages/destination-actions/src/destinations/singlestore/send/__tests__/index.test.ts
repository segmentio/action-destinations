import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONObject } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)

const settings: Settings = {
  host: 'testhost',
  port: '445',
  username: 'testuser',
  password: 'testpassword',
  dbName: 'testdb',
  tableName: 'testtable'
}

const mapping = Object.fromEntries(
  Object.entries(Definition.actions['send'].fields).map(([k, v]) => [k, v.default])
) as JSONObject

const payload1 = {
  messageId: '710de610-83e3-4b9f-9d30-88f8ee6d25ae',
  receivedAt: '2025-07-07T10:19:25.665Z',
  sentAt: '2025-07-07T10:19:25.665Z',
  timestamp: '2025-07-07T10:19:25.665Z'
}

const payload2 = {
  messageId: '99999999-83e3-4b9f-9d30-88f8ee6d25ae',
  receivedAt: '2025-07-07T10:19:25.665Z',
  sentAt: '2025-07-07T10:19:25.665Z',
  timestamp: '2025-07-07T10:19:25.665Z',
  name: 'Event name',
  groupId: 'group1234'
}

const payload3 = {
  messageId: '11111111-83e3-4b9f-9d30-88f8ee6d25ae',
  receivedAt: '2025-07-07T10:19:25.665Z',
  sentAt: '2025-07-07T10:19:25.665Z',
  timestamp: '2025-07-07T10:19:25.665Z',
  name: undefined,
  properties: undefined,
  userId: undefined,
  anonymousId: undefined,
  groupId: undefined,
  traits: undefined
}

const sendSingleJSON = {
  sql: `INSERT INTO \`testtable\` (messageId, timestamp, type, event, name, properties, userId, anonymousId, groupId, traits, context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  database: 'testdb',
  args: [
    '710de610-83e3-4b9f-9d30-88f8ee6d25ae',
    '2025-07-07 10:19:25.665',
    'track',
    'Test Event',
    null,
    {},
    'user1234',
    'anonId1234',
    null,
    {},
    {
      ip: '8.8.8.8',
      library: { name: 'analytics.js', version: '2.11.1' },
      locale: 'en-US',
      location: {
        city: 'San Francisco',
        country: 'United States',
        latitude: 40.2964197,
        longitude: -76.9411617,
        speed: 0
      },
      page: {
        path: '/academy/',
        referrer: '',
        search: '',
        title: 'Analytics Academy',
        url: 'https://segment.com/academy/'
      },
      timezone: 'Europe/Amsterdam',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    }
  ]
}

const sendMultipleJSON = {
  sql: 'INSERT INTO `testtable` (messageId, timestamp, type, event, name, properties, userId, anonymousId, groupId, traits, context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  database: 'testdb',
  args: [
    '710de610-83e3-4b9f-9d30-88f8ee6d25ae',
    '2025-07-07 10:19:25.665',
    'track',
    'Test Event',
    null,
    {},
    'user1234',
    'anonId1234',
    null,
    {},
    {
      ip: '8.8.8.8',
      library: { name: 'analytics.js', version: '2.11.1' },
      locale: 'en-US',
      location: {
        city: 'San Francisco',
        country: 'United States',
        latitude: 40.2964197,
        longitude: -76.9411617,
        speed: 0
      },
      page: {
        path: '/academy/',
        referrer: '',
        search: '',
        title: 'Analytics Academy',
        url: 'https://segment.com/academy/'
      },
      timezone: 'Europe/Amsterdam',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    },
    '99999999-83e3-4b9f-9d30-88f8ee6d25ae',
    '2025-07-07 10:19:25.665',
    'track',
    'Test Event',
    'Event name',
    {},
    'user1234',
    'anonId1234',
    'group1234',
    {},
    {
      ip: '8.8.8.8',
      library: { name: 'analytics.js', version: '2.11.1' },
      locale: 'en-US',
      location: {
        city: 'San Francisco',
        country: 'United States',
        latitude: 40.2964197,
        longitude: -76.9411617,
        speed: 0
      },
      page: {
        path: '/academy/',
        referrer: '',
        search: '',
        title: 'Analytics Academy',
        url: 'https://segment.com/academy/'
      },
      timezone: 'Europe/Amsterdam',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    },
    '11111111-83e3-4b9f-9d30-88f8ee6d25ae',
    '2025-07-07 10:19:25.665',
    'track',
    'Test Event',
    null,
    null,
    null,
    null,
    null,
    null,
    {
      ip: '8.8.8.8',
      library: { name: 'analytics.js', version: '2.11.1' },
      locale: 'en-US',
      location: {
        city: 'San Francisco',
        country: 'United States',
        latitude: 40.2964197,
        longitude: -76.9411617,
        speed: 0
      },
      page: {
        path: '/academy/',
        referrer: '',
        search: '',
        title: 'Analytics Academy',
        url: 'https://segment.com/academy/'
      },
      timezone: 'Europe/Amsterdam',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    }
  ]
}

const createTableJSON = {
  sql: `
        CREATE TABLE IF NOT EXISTS testtable (
          messageId VARCHAR(255) NOT NULL,
          timestamp DATETIME NOT NULL,
          type VARCHAR(255) NOT NULL,
          event VARCHAR(255),
          name VARCHAR(255),
          properties JSON,
          userId VARCHAR(255),
          anonymousId VARCHAR(255),
          groupId VARCHAR(255),
          traits JSON,
          context JSON,
          SHARD KEY ()
        ) AUTOSTATS_CARDINALITY_MODE=PERIODIC AUTOSTATS_HISTOGRAM_MODE=CREATE SQL_MODE='STRICT_ALL_TABLES';
      `,
  database: 'testdb'
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('SingleStore.send', () => {
  it('send signle payload', async () => {
    const event = createTestEvent(payload1)
    nock('https://testhost:445').post('/api/v2/exec', sendSingleJSON).reply(200, {
      lastInsertId: 1,
      rowsAffected: 1
    })
    const responses = await testDestination.testAction('send', {
      event,
      settings,
      useDefaultMappings: true
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('send multiple payloads', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://testhost:445').post('/api/v2/exec', sendMultipleJSON).reply(200, {
      lastInsertId: 3,
      rowsAffected: 3
    })
    const responses = await testDestination.executeBatch('send', {
      events,
      settings,
      mapping
    })
    expect(responses.length).toBe(3)
    expect(responses[0].status).toBe(200)
  })

  it('send failure', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://testhost:445').post('/api/v2/exec', sendMultipleJSON).reply(400, '')
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        mapping
      })
    ).rejects.toThrow('Failed to insert data: Unknown error')
  })

  it('send database failure', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://testhost:445').post('/api/v2/exec', sendMultipleJSON).reply(400, 'Database error')
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        mapping
      })
    ).rejects.toThrow('Failed to insert data: Database error')
  })

  it('test Authentication successfull', async () => {
    nock('https://testhost:445').post('/api/v2/exec', createTableJSON).reply(200, {})
    await testDestination.testAuthentication(settings)
  })

  it('test Authentication failure', async () => {
    nock('https://testhost:445').post('/api/v2/exec', createTableJSON).reply(400, 'Access denied')
    await expect(testDestination.testAuthentication(settings)).rejects.toThrow(
      'Credentials are invalid:  Failed to create table: Access denied'
    )
  })
})
