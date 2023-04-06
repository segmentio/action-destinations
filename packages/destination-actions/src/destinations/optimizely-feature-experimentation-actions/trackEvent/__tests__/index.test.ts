import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { dataFile } from './dataFile'

const testDestination = createTestIntegration(Destination)

describe('OptimizelyFullStack.trackEvent', () => {
  it('should send event successfully', async () => {
    const settings = {
      accountId: '12345566',
      dataFileUrl: 'https://cdn.example.com/dataFile.json'
    }
    nock(settings.dataFileUrl).get('').reply(200, dataFile)
    nock('https://logx.optimizely.com/v1/events').post('').reply(200)
    const event = createTestEvent({
      event: 'Product List Clicked',
      properties: {
        revenue: 1000
      },
      context: {
        traits: {
          test: 'test'
        }
      }
    })
    await expect(
      testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  }),
    it('should throw error if event sent is not in datafile', async () => {
      const settings = {
        accountId: '12345566',
        dataFileUrl: 'https://cdn.example.com/dataFile.json'
      }
      nock(settings.dataFileUrl).get('').reply(200, dataFile)
      nock('https://logx.optimizely.com/v1/events').post('').reply(500, {})
      const event = createTestEvent({
        event: 'Error Test Event',
        properties: {
          revenue: 1000
        },
        context: {
          traits: {
            test: 'test'
          }
        }
      })
      await expect(
        testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
      ).rejects.toThrowError(`Event with name ${event.event} is not defined`)
    })
})
