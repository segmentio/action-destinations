import nock from 'nock'
import { dataFile } from '../mock-dataFile'
import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import Destination from '../../index'
import { getEventId, buildVisitorAttributes } from '../functions'

const testDestination = createTestIntegration(Destination)

describe('.getEventId', () => {
  it('should return eventId for eventKey', async () => {
    expect(getEventId(dataFile, 'Product List Clicked')).toBe('22020998834')
  })
})

describe('.buildVisitorAttributes', () => {
  it('should return visitor attributes for payload', async () => {
    const response = buildVisitorAttributes(dataFile, { test: 'test' })
    expect(response).toStrictEqual([
      {
        entity_id: '18531090301',
        key: 'test',
        value: 'test',
        type: 'custom'
      }
    ])
  })
})

describe('.getEventKeys', () => {
  it('should dynamically fetch event keys', async () => {
    const settings = {
      accountId: '12345566',
      dataFileUrl: 'https://cdn.example.com/dataFile.json'
    }
    const payload = {}
    nock(settings.dataFileUrl).get('').reply(200, dataFile)
    const responses = (await testDestination.testDynamicField('trackEvent', 'eventKey', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(responses).toMatchObject({
      choices: [
        { label: 'Test', value: 'Test' },
        { label: 'Product List Clicked', value: 'Product List Clicked' },
        { label: 'Opendoor Audience Entered', value: 'Opendoor Audience Entered' }
      ]
    })
  })
})
