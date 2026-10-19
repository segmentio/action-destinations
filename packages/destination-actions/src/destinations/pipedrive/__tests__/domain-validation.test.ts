import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { FLAGON_NAME_VALIDATE_DOMAIN, validateDomain } from '../utils'

const testDestination = createTestIntegration(Destination)

const API_TOKEN = 'random string'
const FLAG_ON = { [FLAGON_NAME_VALIDATE_DOMAIN]: true }
const FLAG_OFF = { [FLAGON_NAME_VALIDATE_DOMAIN]: false }

// Same character types and lengths as the domains in active Pipedrive configurations, with a few characters changed.
const ACTIVE_DOMAIN_SHAPES = [
  'blazemonee',
  'tap5',
  'xyz53',
  'autopilox2',
  'elitestrategiex2',
  '84codex',
  'CubiCasx',
  'developed-lunchrxom',
  'partnerdemo-altoix',
  'mohamedhousseindouicx-sandbox',
  'digitalhouse-3131f8',
  'ovrcome-sandbox4'
]

const INJECTION_DOMAINS = [
  'attacker.com/path?x=',
  'attacker.com@legitimate',
  'attacker.com/',
  'attacker.com#',
  'attacker.com:8080',
  'attacker.com\\path',
  'attacker.com%2Fpath',
  'attacker.com%00',
  'companydomain\n',
  'company domain',
  ' companydomain',
  'companydomain ',
  'https://companydomain.pipedrive.com/',
  'companydomain.pipedrive.com',
  'a.b',
  'a_b',
  'ıad',
  'compañy',
  ''
]

const ACTIONS: { name: string; mapping: Record<string, unknown> }[] = [
  { name: 'createUpdateActivity', mapping: { subject: 'Some Name' } },
  { name: 'createUpdateDeal', mapping: { title: 'Some Deal', person_match_value: 'person_value' } },
  { name: 'createUpdateLead', mapping: { title: 'Some Lead', person_match_value: 'person_value' } },
  { name: 'createUpdateNote', mapping: { content: 'Some note', person_match_value: 'person_value' } },
  { name: 'createUpdateOrganization', mapping: { name: 'Acme Corp', match_value: 'org_value' } },
  { name: 'createUpdatePerson', mapping: { name: 'Acme Person', match_value: 'person_value' } }
]

const FIELD_HANDLER_DYNAMIC_FIELDS: { action: string; field: string }[] = [
  { action: 'createUpdateActivity', field: 'person_match_field' },
  { action: 'createUpdateActivity', field: 'organization_match_field' },
  { action: 'createUpdateActivity', field: 'deal_match_field' },
  { action: 'createUpdateDeal', field: 'person_match_field' },
  { action: 'createUpdateDeal', field: 'organization_match_field' },
  { action: 'createUpdateDeal', field: 'deal_match_field' },
  { action: 'createUpdateLead', field: 'person_match_field' },
  { action: 'createUpdateLead', field: 'organization_match_field' },
  { action: 'createUpdateNote', field: 'person_match_field' },
  { action: 'createUpdateNote', field: 'organization_match_field' },
  { action: 'createUpdateNote', field: 'deal_match_field' },
  { action: 'createUpdateOrganization', field: 'match_field' },
  { action: 'createUpdatePerson', field: 'match_field' }
]

function mockPipedriveHost(domain: string) {
  return nock(`https://${domain}.pipedrive.com`)
    .persist()
    .get(/.*/)
    .query(true)
    .reply(200, { data: [{ id: 1 }], additional_data: { pagination: {} } })
    .post(/.*/)
    .query(true)
    .reply(200, { data: { id: 1 } })
    .put(/.*/)
    .query(true)
    .reply(200, { data: { id: 1 } })
    .patch(/.*/)
    .query(true)
    .reply(200, { data: { id: 1 } })
}

function runAction(
  action: string,
  mapping: Record<string, unknown>,
  domain: string,
  features?: Record<string, boolean>
) {
  return testDestination.testAction(action, {
    mapping,
    settings: { apiToken: API_TOKEN, domain },
    features
  })
}

function runDynamicField(action: string, field: string, domain: string, features?: Record<string, boolean>) {
  return testDestination.testDynamicField(action, field, {
    settings: { apiToken: API_TOKEN, domain },
    payload: {},
    features
  })
}

beforeEach(() => {
  nock.cleanAll()
  nock.disableNetConnect()
})

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('validateDomain', () => {
  it.each(ACTIVE_DOMAIN_SHAPES)('accepts %s', (domain) => {
    expect(() => validateDomain(domain)).not.toThrow()
  })

  it.each(['a', 'A', '1', 'a-b', 'A1-b2-C3', '-', 'a--b', 'x'.repeat(63)])('accepts %s', (domain) => {
    expect(() => validateDomain(domain)).not.toThrow()
  })

  it.each(INJECTION_DOMAINS)('rejects %j', (domain) => {
    expect(() => validateDomain(domain)).toThrowError(/Invalid domain/)
  })

  it('rejects undefined and null', () => {
    expect(() => validateDomain(undefined as unknown as string)).toThrowError()
    expect(() => validateDomain(null as unknown as string)).toThrowError()
  })
})

describe('testAuthentication', () => {
  it.each(ACTIVE_DOMAIN_SHAPES)('sends to the Pipedrive host for %s', async (domain) => {
    const scope = nock(`https://${domain}.pipedrive.com`).get('/api/v1/users/me').query(true).reply(200, {})
    await expect(testDestination.testAuthentication({ apiToken: API_TOKEN, domain })).resolves.not.toThrow()
    expect(scope.isDone()).toBe(true)
  })

  it.each(INJECTION_DOMAINS)('rejects %j without sending a request', async (domain) => {
    await expect(testDestination.testAuthentication({ apiToken: API_TOKEN, domain })).rejects.toThrowError(
      /Invalid domain/
    )
  })
})

describe.each(ACTIONS)('$name', ({ name, mapping }) => {
  describe('flag on', () => {
    it.each(ACTIVE_DOMAIN_SHAPES)('delivers to the Pipedrive host for %s', async (domain) => {
      mockPipedriveHost(domain)
      const responses = await runAction(name, mapping, domain, FLAG_ON)
      expect(responses.length).toBeGreaterThan(0)
      responses.forEach((r) => expect(new URL(r.url).host).toBe(`${domain.toLowerCase()}.pipedrive.com`))
    })

    it.each(INJECTION_DOMAINS)('rejects %j before sending any request', async (domain) => {
      await expect(runAction(name, mapping, domain, FLAG_ON)).rejects.toThrowError(/Invalid domain/)
    })
  })

  describe('flag off', () => {
    it.each(ACTIVE_DOMAIN_SHAPES)('delivers to the Pipedrive host for %s', async (domain) => {
      mockPipedriveHost(domain)
      const responses = await runAction(name, mapping, domain, FLAG_OFF)
      expect(responses.length).toBeGreaterThan(0)
      responses.forEach((r) => expect(new URL(r.url).host).toBe(`${domain.toLowerCase()}.pipedrive.com`))
    })

    it('does not validate, so a dotted domain still sends as before', async () => {
      mockPipedriveHost('a.b')
      const responses = await runAction(name, mapping, 'a.b', FLAG_OFF)
      expect(responses.length).toBeGreaterThan(0)
      responses.forEach((r) => expect(new URL(r.url).host).toBe('a.b.pipedrive.com'))
    })
  })

  describe('no features', () => {
    it('does not validate, so a dotted domain still sends as before', async () => {
      mockPipedriveHost('a.b')
      const responses = await runAction(name, mapping, 'a.b')
      expect(responses.length).toBeGreaterThan(0)
      responses.forEach((r) => expect(new URL(r.url).host).toBe('a.b.pipedrive.com'))
    })
  })
})

describe.each(FIELD_HANDLER_DYNAMIC_FIELDS)('dynamic field $action.$field', ({ action, field }) => {
  it.each(ACTIVE_DOMAIN_SHAPES)('flag on fetches fields from the Pipedrive host for %s', async (domain) => {
    const scope = nock(`https://${domain}.pipedrive.com`)
      .get(/.*/)
      .query(true)
      .reply(200, { data: [{ name: 'Field', key: 'field_key' }], additional_data: { pagination: {} } })
    await runDynamicField(action, field, domain, FLAG_ON)
    expect(scope.isDone()).toBe(true)
  })

  it.each(INJECTION_DOMAINS)('flag on rejects %j before sending any request', async (domain) => {
    await expect(runDynamicField(action, field, domain, FLAG_ON)).rejects.toThrowError(/Invalid domain/)
  })

  it('flag off does not validate, so a dotted domain still fetches as before', async () => {
    const scope = nock('https://a.b.pipedrive.com')
      .get(/.*/)
      .query(true)
      .reply(200, { data: [{ name: 'Field', key: 'field_key' }], additional_data: { pagination: {} } })
    await runDynamicField(action, field, 'a.b', FLAG_OFF)
    expect(scope.isDone()).toBe(true)
  })
})

describe('dynamic field createUpdateActivity.type', () => {
  it.each(ACTIVE_DOMAIN_SHAPES)('flag on fetches activity types from the Pipedrive host for %s', async (domain) => {
    const scope = nock(`https://${domain}.pipedrive.com`)
      .get('/api/v1/activityTypes')
      .query(true)
      .reply(200, { data: [{ name: 'Call', key_string: 'call' }] })
    await runDynamicField('createUpdateActivity', 'type', domain, FLAG_ON)
    expect(scope.isDone()).toBe(true)
  })

  it.each(INJECTION_DOMAINS)('flag on rejects %j before sending any request', async (domain) => {
    await expect(runDynamicField('createUpdateActivity', 'type', domain, FLAG_ON)).rejects.toThrowError(
      /Invalid domain/
    )
  })

  it('flag off does not validate, so a dotted domain still fetches as before', async () => {
    const scope = nock('https://a.b.pipedrive.com')
      .get('/api/v1/activityTypes')
      .query(true)
      .reply(200, { data: [{ name: 'Call', key_string: 'call' }] })
    await runDynamicField('createUpdateActivity', 'type', 'a.b', FLAG_OFF)
    expect(scope.isDone()).toBe(true)
  })
})
