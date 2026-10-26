import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { validateDomain } from '../utils'

const testDestination = createTestIntegration(Destination)

const API_TOKEN = 'random string'
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
  const run = (domain: string) =>
    testDestination.testAction(name, { mapping, settings: { apiToken: API_TOKEN, domain } })

  it('sends to the Pipedrive host for a valid domain', async () => {
    mockPipedriveHost(VALID_DOMAIN)
    const responses = await run(VALID_DOMAIN)
    expect(responses.length).toBeGreaterThan(0)
    responses.forEach((r) => expect(new URL(r.url).host).toBe(`${VALID_DOMAIN}.pipedrive.com`))
  })

  it('rejects an invalid domain without sending a request', async () => {
    await expect(run(BAD_DOMAIN)).rejects.toThrowError(/Invalid domain/)
  })
})

describe.each(DYNAMIC_FIELDS)('dynamic field $action.$field', ({ action, field }) => {
  const run = (domain: string) =>
    testDestination.testDynamicField(action, field, {
      settings: { apiToken: API_TOKEN, domain },
      payload: {}
    })

  it('fetches from the Pipedrive host for a valid domain', async () => {
    mockPipedriveHost(VALID_DOMAIN)
    const result = await run(VALID_DOMAIN)
    expect(result.choices.length).toBeGreaterThan(0)
  })

  it('rejects an invalid domain without sending a request', async () => {
    await expect(run(BAD_DOMAIN)).rejects.toThrowError(/Invalid domain/)
  })
})
