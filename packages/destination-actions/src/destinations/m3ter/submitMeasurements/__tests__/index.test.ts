import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { M3TER_INGEST_API, MAX_MEASUREMENTS_PER_BATCH } from '../../constants'

const testDestination = createTestIntegration(Destination)

const orgId = '9d105e27-78d5-21f1-d212-5451a1e500cd'
const access_token = 'validAccessToken'
const SETTINGS = {
  access_key_id: 'validKey',
  api_secret: 'validSecret',
  org_id: orgId
}
describe('m3ter.submitMeasurements', () => {
  it('should submitMeasurement', async () => {
    nock(M3TER_INGEST_API)
      .post(`/organizations/${orgId}/measurements`)
      .matchHeader('Authorization', `Bearer ${access_token}`)
      .reply(200, { result: 'accepted' })

    const event = createTestEvent({
      type: 'track',
      event: 'UsageRecorded',
      properties: {
        uid: '0059915c-dea7-4682-b06d-52f315b12f5e',
        meter: 'meterCode',
        account: 'accountCode',
        ts: '2012-04-23T18:25:43.511Z'
      }
    })

    const response = await testDestination.testAction('submitMeasurements', {
      event,
      settings: SETTINGS,
      auth: { accessToken: access_token, refreshToken: 'someRefreshToken' },
      mapping: {
        uid: {
          '@path': '$.properties.uid'
        },
        meter: {
          '@path': '$.properties.meter'
        },
        account: {
          '@path': '$.properties.account'
        },
        ts: {
          '@path': '$.properties.ts'
        },
        enable_batching: false
      }
    })
    expect(response[0].status).toBe(200)
    expect(await response[0].request.json()).toMatchObject({
      measurements: [
        {
          uid: event?.properties?.uid,
          meter: event?.properties?.meter,
          account: event?.properties?.account,
          ts: event?.properties?.ts
        }
      ]
    })
  })
  it('should submitMeasurement in a batch', async () => {
    nock(M3TER_INGEST_API)
      .post(`/organizations/${orgId}/measurements`)
      .times(2)
      .matchHeader('Authorization', `Bearer ${access_token}`)
      .reply(200, { result: 'accepted' })

    const event = createTestEvent({
      type: 'track',
      event: 'UsageRecorded',
      properties: {
        uid: '0059915c-dea7-4682-b06d-52f315b12f5e',
        meter: 'meterCode',
        account: 'accountCode',
        ts: '2012-04-23T18:25:43.511Z'
      }
    })
    const eventsExceedingMaxBatch = 10
    const response = await testDestination.testBatchAction('submitMeasurements', {
      events: Array(MAX_MEASUREMENTS_PER_BATCH + eventsExceedingMaxBatch).fill(event),
      settings: SETTINGS,
      auth: { accessToken: access_token, refreshToken: 'someRefreshToken' },
      mapping: {
        uid: {
          '@path': '$.properties.uid'
        },
        meter: {
          '@path': '$.properties.meter'
        },
        account: {
          '@path': '$.properties.account'
        },
        ts: {
          '@path': '$.properties.ts'
        },
        enable_batching: true
      }
    })
    expect(response[0].status).toBe(200)
    expect(await response[0].request.json()).toMatchObject({
      measurements: Array(MAX_MEASUREMENTS_PER_BATCH).fill({
        uid: event?.properties?.uid,
        meter: event?.properties?.meter,
        account: event?.properties?.account,
        ts: event?.properties?.ts
      })
    })

    expect(response[1].status).toBe(200)
    expect(await response[1].request.json()).toMatchObject({
      measurements: Array(eventsExceedingMaxBatch).fill({
        uid: event?.properties?.uid,
        meter: event?.properties?.meter,
        account: event?.properties?.account,
        ts: event?.properties?.ts
      })
    })
  })

  it('should throw error when missing required field', async () => {
    const event = createTestEvent()
    await expect(
      testDestination.testAction('submitMeasurements', {
        event,
        settings: SETTINGS,
        auth: { accessToken: access_token, refreshToken: 'someRefreshToken' },
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })
})
