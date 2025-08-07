import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { list_id } from 'src/destinations/klaviyo/properties'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {}

const payload = {
  event: 'Test Event',
  type: 'track',
  userId: 'x_id',
  anonymousId: 'anon_id',
  properties: {
    email: 'test@test.com',
    list_id: 'list_id',
    prop1: 'value1',
    prop2: true,
    prop3: 123,
    prop4: ['value1', 'value2'],
    prop5: { nested: 'value' }
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  __segment_internal_sync_mode: 'update',
  object_details: {
    object_type: 'objectx',
    id_field_name: 'x_id_field',
    id_field_value: { '@path': '$.userId' },
    property_group: 'objectxinformation'
  },
  properties: { '@path': '$.properties.regular' },
  sensitive_properties: { '@path': '$.properties.sensitive' },
  association_sync_mode: 'upsert',
  associations: [],
  enable_batching: true,
  batch_size: 100
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Hubspot.upsertObject', () => {
  describe('where syncMode = upsert', () => {
    describe('No matching object found in Hubspot', () => {
      it('should throw an error', async () => {
        const event = createTestEvent(payload)

        nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/objectx').reply(400)

        nock(HUBSPOT_BASE_URL).get('/crm/v3/properties/objectx?dataSensitivity=sensitive').reply(400)

        await expect(
          testDestination.testAction('upsertObject', {
            event,
            settings,
            useDefaultMappings: true,
            mapping
          })
        ).rejects.toThrowError(new Error('Bad Request'))
      })
    })
  })
})