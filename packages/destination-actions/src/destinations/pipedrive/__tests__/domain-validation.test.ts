import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { FLAGON_NAME_VALIDATE_DOMAIN, validateDomain } from '../utils'

const testDestination = createTestIntegration(Destination)

const API_TOKEN = 'random string'
const FLAG_ON = { [FLAGON_NAME_VALIDATE_DOMAIN]: true }
const FLAG_OFF = { [FLAGON_NAME_VALIDATE_DOMAIN]: false }
const VALID_DOMAIN = 'companydomain'
const BAD_DOMAIN = 'attacker.com/path?x='

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

const INVALID_DOMAINS = [
  'attacker.com/path?x=',
  'attacker.com@legitimate',
  'attacker.com#',
  'attacker.com:8080',
  'attacker.com\\path',
  'attacker.com%2Fpath',
  'companydomain\n',
  'company domain',
  'https://companydomain.pipedrive.com/',
  'companydomain.pipedrive.com',
  'a.b',
  'a_b',
  'ıad',
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

const DYNAMIC_FIELDS = [
  { action: 'createUpdatePerson', field: 'match_field' },
  { action: 'createUpdateActivity', field: 'type' }
]

function mockPipedriveHost(domain: string) {
  return nock(`https://${domain}.pipedrive.com`)
    .persist()
    .get(/.*/)
    .query(true)
    .reply(200, { data: [{ id: 1, name: 'Field', key: 'field_key', key_string: 'field_key' }] })
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

  it.each(['a', 'A', '1', 'a-b', 'x'.repeat(63)])('accepts %s', (domain) => {
    expect(() => validateDomain(domain)).not.toThrow()
  })

  it.each(INVALID_DOMAINS)('rejects %j', (domain) => {
    expect(() => validateDomain(domain)).toThrowError(/Invalid domain/)
  })

  it('rejects undefined and null', () => {
    expect(() => validateDomain(undefined as unknown as string)).toThrowError(/Invalid domain/)
    expect(() => validateDomain(null as unknown as string)).toThrowError(/Invalid domain/)
  })
})

describe('testAuthentication', () => {
  it('sends to the Pipedrive host for a valid domain', async () => {
    const scope = nock(`https://${VALID_DOMAIN}.pipedrive.com`).get('/api/v1/users/me').query(true).reply(200, {})
    await testDestination.testAuthentication({ apiToken: API_TOKEN, domain: VALID_DOMAIN })
    expect(scope.isDone()).toBe(true)
  })

  it('rejects an invalid domain without sending a request', async () => {
    await expect(testDestination.testAuthentication({ apiToken: API_TOKEN, domain: BAD_DOMAIN })).rejects.toThrowError(
      /Invalid domain/
    )
  })
})

describe.each(ACTIONS)('$name', ({ name, mapping }) => {
  const run = (domain: string, features?: Record<string, boolean>) =>
    testDestination.testAction(name, { mapping, settings: { apiToken: API_TOKEN, domain }, features })

  it('flag on: sends to the Pipedrive host for a valid domain', async () => {
    mockPipedriveHost(VALID_DOMAIN)
    const responses = await run(VALID_DOMAIN, FLAG_ON)
    expect(responses.length).toBeGreaterThan(0)
    responses.forEach((r) => expect(new URL(r.url).host).toBe(`${VALID_DOMAIN}.pipedrive.com`))
  })

  it('flag on: rejects an invalid domain without sending a request', async () => {
    await expect(run(BAD_DOMAIN, FLAG_ON)).rejects.toThrowError(/Invalid domain/)
  })

  it('flag off: does not validate, so a dotted domain still sends as before', async () => {
    mockPipedriveHost('a.b')
    const responses = await run('a.b', FLAG_OFF)
    expect(responses.length).toBeGreaterThan(0)
    responses.forEach((r) => expect(new URL(r.url).host).toBe('a.b.pipedrive.com'))
  })
})

describe.each(DYNAMIC_FIELDS)('dynamic field $action.$field', ({ action, field }) => {
  const run = (domain: string, features?: Record<string, boolean>) =>
    testDestination.testDynamicField(action, field, {
      settings: { apiToken: API_TOKEN, domain },
      payload: {},
      features
    })

  it('flag on: fetches from the Pipedrive host for a valid domain', async () => {
    mockPipedriveHost(VALID_DOMAIN)
    const result = await run(VALID_DOMAIN, FLAG_ON)
    expect(result.choices.length).toBeGreaterThan(0)
  })

  it('flag on: rejects an invalid domain without sending a request', async () => {
    await expect(run(BAD_DOMAIN, FLAG_ON)).rejects.toThrowError(/Invalid domain/)
  })

  it('flag off: does not validate, so a dotted domain still fetches as before', async () => {
    mockPipedriveHost('a.b')
    const result = await run('a.b', FLAG_OFF)
    expect(result.choices.length).toBeGreaterThan(0)
  })
})
