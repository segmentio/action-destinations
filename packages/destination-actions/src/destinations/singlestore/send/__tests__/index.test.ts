import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONObject } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { SSRF_HARDENING_FLAGON } from '../../utils'

let testDestination = createTestIntegration(Definition)

const settings: Settings = {
  host: 'test.svc.singlestore.com',
  port: '445',
  username: 'testuser',
  password: 'testpassword',
  dbName: 'testdb',
  tableName: 'testtable'
}

const hardened = { [SSRF_HARDENING_FLAGON]: true }

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
        CREATE TABLE IF NOT EXISTS \`testtable\` (
          messageId TEXT NOT NULL,
          timestamp DATETIME(6) NOT NULL,
          type TEXT NOT NULL,
          event TEXT,
          name TEXT,
          properties JSON,
          userId TEXT,
          anonymousId TEXT,
          groupId TEXT,
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
    nock('https://test.svc.singlestore.com:445').post('/api/v2/exec', sendSingleJSON).reply(200, {
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
    nock('https://test.svc.singlestore.com:445').post('/api/v2/exec', sendMultipleJSON).reply(200, {
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
    nock('https://test.svc.singlestore.com:445').post('/api/v2/exec', sendMultipleJSON).reply(400, '')
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        features: hardened,
        mapping
      })
    ).rejects.toThrow('Failed to insert data: Request failed with status 400')
  })

  it('send database failure returns the parsed error message', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://test.svc.singlestore.com:445')
      .post('/api/v2/exec', sendMultipleJSON)
      .reply(400, { error: 'Database error' })
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        features: hardened,
        mapping
      })
    ).rejects.toThrow('Failed to insert data: Database error')
  })

  it('does not echo a non-JSON response body', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://test.svc.singlestore.com:445')
      .post('/api/v2/exec', sendMultipleJSON)
      .reply(400, '<html>internal page</html>')
    const error = await testDestination
      .executeBatch('send', { events, settings, features: hardened, mapping })
      .then(() => undefined)
      .catch((e) => e)
    expect(error.message).toBe('Failed to insert data: Request failed with status 400')
  })

  it('truncates long error messages', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://test.svc.singlestore.com:445')
      .post('/api/v2/exec', sendMultipleJSON)
      .reply(400, { error: 'x'.repeat(500) })
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        features: hardened,
        mapping
      })
    ).rejects.toThrow(`Failed to insert data: ${'x'.repeat(200)}`)
  })

  it.each([
    ['absent', undefined],
    ['off', { [SSRF_HARDENING_FLAGON]: false }]
  ])('keeps the legacy error text when the flag is %s', async (_state, features) => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://test.svc.singlestore.com:445').post('/api/v2/exec', sendMultipleJSON).reply(400, 'Database error')
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        features,
        mapping
      })
    ).rejects.toThrow('Failed to insert data: Database error')
  })

  it('keeps the legacy "Unknown error" text for an empty body when the flag is off', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2), createTestEvent(payload3)]
    nock('https://test.svc.singlestore.com:445').post('/api/v2/exec', sendMultipleJSON).reply(400, '')
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings,
        mapping
      })
    ).rejects.toThrow('Failed to insert data: Unknown error')
  })

  it.each([
    '127.0.0.1', // loopback: the classic SSRF target
    'localhost', // resolves to loopback, and does not end in .singlestore.com
    '169.254.169.254', // cloud metadata service IP
    'example.com', // a public site: reachable by anyone, so it must not be usable as an open proxy
    'evil.com/test.svc.singlestore.com', // path trick: the allowed domain is in the path, not the host
    'test.svc.singlestore.com@evil.com', // userinfo trick: everything before @ is a username, real host is evil.com
    'test.svc.singlestore.com:8080', // port belongs in the Port setting; ":" is not a valid hostname character
    'singlestore.com.evil.com', // allowed domain used as a prefix, but the real domain is evil.com
    'evilsinglestore.com', // missing the dot, so it is a different domain, not a subdomain
    'singlestore.com', // bare domain with no subdomain; real customer hosts always have one
    'test.svc.singlestore.com.', // a trailing dot is valid DNS but not the format customers use
    'https://test.svc.singlestore.com', // the scheme is added by the code, a user-supplied one is rejected
    'test.svc.singlestore.com?x=1', // a query string could change the request URL
    'test.svc.singlestore.com#@evil.com', // fragment plus @ is a URL-parser confusion trick
    'test.svc.singlestore.com\\@evil.com', // some URL parsers treat a backslash like a slash
    '[::1]', // IPv6 loopback
    '2130706433', // 127.0.0.1 written as a single decimal number
    '0x7f.0.0.1', // 127.0.0.1 written in hex
    '-a.singlestore.com', // a hostname label cannot start with a hyphen
    'a..singlestore.com', // empty label between the dots
    'a_b.singlestore.com', // underscores are not valid in hostnames
    'test.svc.singlestorе.com', // the "е" is a Cyrillic letter that looks like a Latin "e"
    'evil.com\n.singlestore.com', // an embedded newline could split the value in some parsers
    'evil.com\u0000.singlestore.com', // a null byte can truncate the string in lower-level code
    '' // an empty host
  ])('rejects invalid host %p', async (host) => {
    await expect(testDestination.testAuthentication({ ...settings, host })).rejects.toThrow(
      'Host must be a SingleStore hostname ending in ".singlestore.com".'
    )
  })

  it('rejects a missing host', async () => {
    const { host, ...settingsWithoutHost } = settings
    await expect(testDestination.testAuthentication(settingsWithoutHost as Settings)).rejects.toThrow(
      "missing the required field 'host'"
    )
  })

  it.each([
    ['TEST.SVC.SINGLESTORE.COM', 'test.svc.singlestore.com'], // hostnames are case-insensitive, so it is lowercased
    ['  test.svc.singlestore.com  ', 'test.svc.singlestore.com'], // copy-paste whitespace is trimmed
    [
      // standard Helios host shape
      'svc-00000000-0000-0000-0000-000000000000-dml.aws-virginia-7.svc.singlestore.com',
      'svc-00000000-0000-0000-0000-000000000000-dml.aws-virginia-7.svc.singlestore.com'
    ],
    [
      // shared cluster shape, different region
      'svc-00000000-0000-0000-0000-000000000000-shared-dml.aws-oregon-4.svc.singlestore.com',
      'svc-00000000-0000-0000-0000-000000000000-shared-dml.aws-oregon-4.svc.singlestore.com'
    ],
    [
      // region name containing letters and digits ("hd2")
      'svc-00000000-0000-0000-0000-000000000000-shared-dml.aws-virginia-hd2.svc.singlestore.com',
      'svc-00000000-0000-0000-0000-000000000000-shared-dml.aws-virginia-hd2.svc.singlestore.com'
    ]
  ])('accepts valid host %p', async (host, expectedHost) => {
    nock(`https://${expectedHost}:445`).post('/api/v2/exec', createTableJSON).reply(200, {})
    await testDestination.testAuthentication({ ...settings, host })
  })

  it.each([
    '0', // port 0 is reserved and never valid
    '65536', // one above the maximum: a port is a 16-bit number, so 65535 is the largest
    'abc', // not a number
    '44 3', // whitespace inside the value
    '-1' // a "-" is not a digit, so negative numbers fail the digits-only check
  ])('rejects invalid port %p', async (port) => {
    await expect(testDestination.testAuthentication({ ...settings, port })).rejects.toThrow(
      'Port must be a number between 1 and 65535.'
    )
  })

  it('defaults the port to 443', async () => {
    nock('https://test.svc.singlestore.com:443').post('/api/v2/exec', createTableJSON).reply(200, {})
    await testDestination.testAuthentication({ ...settings, port: '' })
  })

  it('validates the host before sending events when the flag is on', async () => {
    const event = createTestEvent(payload1)
    await expect(
      testDestination.testAction('send', {
        event,
        settings: { ...settings, host: '127.0.0.1' },
        features: hardened,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Host must be a SingleStore hostname ending in ".singlestore.com".')
  })

  it('validates the host for batches when the flag is on', async () => {
    const events = [createTestEvent(payload1), createTestEvent(payload2)]
    await expect(
      testDestination.executeBatch('send', {
        events,
        settings: { ...settings, host: '127.0.0.1' },
        features: hardened,
        mapping
      })
    ).rejects.toThrow('Host must be a SingleStore hostname ending in ".singlestore.com".')
  })

  it('validates the port before sending events when the flag is on', async () => {
    const event = createTestEvent(payload1)
    await expect(
      testDestination.testAction('send', {
        event,
        settings: { ...settings, port: 'abc' },
        features: hardened,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Port must be a number between 1 and 65535.')
  })

  it('defaults the port to 443 when the flag is on', async () => {
    const event = createTestEvent(payload1)
    nock('https://test.svc.singlestore.com:443').post('/api/v2/exec', sendSingleJSON).reply(200, {
      lastInsertId: 1,
      rowsAffected: 1
    })
    const responses = await testDestination.testAction('send', {
      event,
      settings: { ...settings, port: '' },
      features: hardened,
      useDefaultMappings: true
    })
    expect(responses[0].status).toBe(200)
  })

  it.each([
    ['absent', undefined],
    ['off', { [SSRF_HARDENING_FLAGON]: false }]
  ])('keeps the legacy behavior and sends to any host when the flag is %s', async (_state, features) => {
    const event = createTestEvent(payload1)
    nock('https://testhost:445').post('/api/v2/exec', sendSingleJSON).reply(200, {
      lastInsertId: 1,
      rowsAffected: 1
    })
    const responses = await testDestination.testAction('send', {
      event,
      settings: { ...settings, host: 'testhost' },
      features,
      useDefaultMappings: true
    })
    expect(responses[0].status).toBe(200)
  })

  it('always enforces the host allowlist in testAuthentication, regardless of the flag', async () => {
    await expect(testDestination.testAuthentication({ ...settings, host: 'testhost' })).rejects.toThrow(
      'Host must be a SingleStore hostname ending in ".singlestore.com".'
    )
  })

  it('test Authentication successful', async () => {
    nock('https://test.svc.singlestore.com:445').post('/api/v2/exec', createTableJSON).reply(200, {})
    await testDestination.testAuthentication(settings)
  })

  it('test Authentication failure', async () => {
    nock('https://test.svc.singlestore.com:445')
      .post('/api/v2/exec', createTableJSON)
      .reply(400, { error: 'Access denied' })
    await expect(testDestination.testAuthentication(settings)).rejects.toThrow(
      'Credentials are invalid:  Failed to create table: Access denied'
    )
  })
})
