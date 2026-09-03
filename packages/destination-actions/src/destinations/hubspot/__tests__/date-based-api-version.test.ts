import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import {
  HUBSPOT_DATE_BASED_API_VERSION,
  HUBSPOT_DATE_BASED_API_VERSION_FLAG,
  hubspotUrls,
  useDateBasedApiVersion
} from '../versioning-info'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {}

const dateBased = { [HUBSPOT_DATE_BASED_API_VERSION_FLAG]: true }
const legacy = { [HUBSPOT_DATE_BASED_API_VERSION_FLAG]: false }

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('hubspotUrls', () => {
  it('resolves every API family to its date-based path when the flag is on', () => {
    expect(hubspotUrls(dateBased)).toEqual({
      objects: `${HUBSPOT_BASE_URL}/crm/objects/2026-03`,
      recordAssociations: `${HUBSPOT_BASE_URL}/crm/objects/2026-03`,
      properties: `${HUBSPOT_BASE_URL}/crm/properties/2026-03`,
      schemas: `${HUBSPOT_BASE_URL}/crm-object-schemas/2026-03/schemas`,
      lists: `${HUBSPOT_BASE_URL}/crm/lists/2026-03`,
      associations: `${HUBSPOT_BASE_URL}/crm/associations/2026-03`,
      events: `${HUBSPOT_BASE_URL}/events/2026-03`
    })
  })

  it('resolves every API family to its legacy path when the flag is off', () => {
    expect(hubspotUrls(legacy)).toEqual({
      objects: `${HUBSPOT_BASE_URL}/crm/v3/objects`,
      recordAssociations: `${HUBSPOT_BASE_URL}/crm/v4/objects`,
      properties: `${HUBSPOT_BASE_URL}/crm/v3/properties`,
      schemas: `${HUBSPOT_BASE_URL}/crm/v3/schemas`,
      lists: `${HUBSPOT_BASE_URL}/crm/v3/lists`,
      associations: `${HUBSPOT_BASE_URL}/crm/v4/associations`,
      events: `${HUBSPOT_BASE_URL}/events/v3`
    })
  })

  it('falls back to the legacy paths when features are unavailable', () => {
    expect(hubspotUrls(undefined)).toEqual(hubspotUrls(legacy))
    expect(hubspotUrls({})).toEqual(hubspotUrls(legacy))
    expect(useDateBasedApiVersion(undefined)).toBe(false)
    expect(useDateBasedApiVersion(dateBased)).toBe(true)
  })

  it('pins the version this destination targets', () => {
    expect(HUBSPOT_DATE_BASED_API_VERSION).toBe('2026-03')
  })
})

describe('date-based API version: upsertContact', () => {
  const event = createTestEvent({
    type: 'identify',
    traits: { email: 'vep@beri.dz', first_name: 'John' }
  })
  const mapping = { email: { '@path': '$.traits.email' }, firstname: { '@path': '$.traits.first_name' } }
  const transactionContext = { transaction: {}, setTransaction: () => {} }

  it('updates a contact against /crm/objects/2026-03', async () => {
    const scope = nock(HUBSPOT_BASE_URL)
      .patch('/crm/objects/2026-03/contacts/vep@beri.dz')
      .query({ idProperty: 'email' })
      .reply(200, { id: '801', properties: { email: 'vep@beri.dz' } })

    const responses = await testDestination.testAction('upsertContact', {
      event,
      settings,
      mapping,
      transactionContext,
      features: dateBased
    })

    expect(scope.isDone()).toBe(true)
    expect(responses[0].status).toBe(200)
  })

  it('creates a contact against /crm/objects/2026-03 after a 404 on update', async () => {
    nock(HUBSPOT_BASE_URL)
      .patch('/crm/objects/2026-03/contacts/vep@beri.dz')
      .query({ idProperty: 'email' })
      .reply(404, { status: 'error', message: 'resource not found' })

    const createScope = nock(HUBSPOT_BASE_URL)
      .post('/crm/objects/2026-03/contacts')
      .reply(201, { id: '801', properties: { email: 'vep@beri.dz' } })

    await testDestination.testAction('upsertContact', {
      event,
      settings,
      mapping,
      transactionContext,
      features: dateBased
    })

    expect(createScope.isDone()).toBe(true)
  })

  it('batches contacts against /crm/objects/2026-03', async () => {
    const readScope = nock(HUBSPOT_BASE_URL)
      .post('/crm/objects/2026-03/contacts/batch/read')
      .reply(200, { status: 'COMPLETE', results: [] })

    await testDestination.testBatchAction('upsertContact', {
      events: [event],
      settings,
      mapping,
      features: dateBased
    })

    expect(readScope.isDone()).toBe(true)
  })

  it('still uses /crm/v3 when the flag is off', async () => {
    const scope = nock(HUBSPOT_BASE_URL)
      .patch('/crm/v3/objects/contacts/vep@beri.dz')
      .query({ idProperty: 'email' })
      .reply(200, { id: '801', properties: { email: 'vep@beri.dz' } })

    await testDestination.testAction('upsertContact', {
      event,
      settings,
      mapping,
      transactionContext,
      features: legacy
    })

    expect(scope.isDone()).toBe(true)
  })
})

describe('date-based API version: custom behavioral events', () => {
  it('sends an event occurrence to /events/2026-03/send', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: { email: 'vep@beri.dz' }
    })

    nock(HUBSPOT_BASE_URL).post('/events/2026-03/send').reply(204)

    const responses = await testDestination.testAction('sendCustomBehavioralEvent', {
      event,
      settings: { portalId: '22596207' },
      mapping: {
        eventName: { '@path': '$.event' },
        email: { '@path': '$.properties.email' }
      },
      features: dateBased
    })

    expect(responses[0].status).toBe(204)
  })

  it('still uses /events/v3/send when the flag is off', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: { email: 'vep@beri.dz' }
    })

    nock(HUBSPOT_BASE_URL).post('/events/v3/send').reply(204)

    const responses = await testDestination.testAction('sendCustomBehavioralEvent', {
      event,
      settings: { portalId: '22596207' },
      mapping: {
        eventName: { '@path': '$.event' },
        email: { '@path': '$.properties.email' }
      },
      features: legacy
    })

    expect(responses[0].status).toBe(204)
  })
})

describe('date-based API version: upsertObject', () => {
  const payload = {
    event: 'Test Custom Object Event',
    type: 'track',
    userId: 'user_id_1',
    properties: {
      email: 'test@test.com',
      regular: { str_prop: 'Hello String!' },
      company_id: 'company_id_1'
    }
  } as Partial<SegmentEvent>

  const mapping = {
    __segment_internal_sync_mode: 'upsert',
    object_details: {
      object_type: 'contact',
      id_field_name: 'email',
      id_field_value: { '@path': '$.properties.email' },
      property_group: 'contactinformation'
    },
    properties: { '@path': '$.properties.regular' },
    association_sync_mode: 'upsert',
    associations: [],
    enable_batching: true,
    batch_size: 100
  }

  const propertiesResp = {
    results: [{ name: 'str_prop', type: 'string', fieldType: 'text', hasUniqueValue: false }]
  }

  const upsertObjectResp = {
    results: [{ id: '62102303560', properties: { email: 'test@test.com' } }]
  }

  it('reads properties and upserts records against the 2026-03 paths', async () => {
    const propsScope = nock(HUBSPOT_BASE_URL).get('/crm/properties/2026-03/contact').reply(200, propertiesResp)
    const upsertScope = nock(HUBSPOT_BASE_URL)
      .post('/crm/objects/2026-03/contact/batch/upsert')
      .reply(200, upsertObjectResp)

    const responses = await testDestination.testAction('upsertObject', {
      event: createTestEvent(payload),
      settings,
      useDefaultMappings: true,
      mapping,
      features: dateBased
    })

    expect(propsScope.isDone()).toBe(true)
    expect(upsertScope.isDone()).toBe(true)
    expect(responses.length).toBe(2)
  })

  it('creates associations against /crm/associations/2026-03', async () => {
    nock(HUBSPOT_BASE_URL).get('/crm/properties/2026-03/contact').reply(200, propertiesResp)
    nock(HUBSPOT_BASE_URL).post('/crm/objects/2026-03/contact/batch/upsert').reply(200, upsertObjectResp)
    const assocRecordScope = nock(HUBSPOT_BASE_URL)
      .post('/crm/objects/2026-03/company/batch/upsert')
      .reply(200, { results: [{ id: '798758764867', properties: { kompany: 'company_id_1' } }] })
    const assocScope = nock(HUBSPOT_BASE_URL).post('/crm/associations/2026-03/contact/company/batch/create').reply(200)

    const responses = await testDestination.testAction('upsertObject', {
      event: createTestEvent(payload),
      settings,
      useDefaultMappings: true,
      mapping: {
        ...mapping,
        associations: [
          {
            object_type: 'company',
            association_label: 'HUBSPOT_DEFINED:1',
            id_field_name: 'kompany',
            id_field_value: { '@path': '$.properties.company_id' }
          }
        ]
      },
      features: dateBased
    })

    expect(assocRecordScope.isDone()).toBe(true)
    expect(assocScope.isDone()).toBe(true)
    expect(responses.length).toBe(4)
  })
})
