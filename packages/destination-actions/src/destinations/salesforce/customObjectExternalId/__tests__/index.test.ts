import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Salesforce.customObjectExternalId', () => {
  // TODO: Test your action
  it('Should end events successfully', () => {
    const event = createTestEvent()
    console.log(event)
    nock('https://example.com').post('/').reply(200, {})
    return testDestination.testAction('customObjectExternalId', {
      settings: {
        instanceUrl: 'https://example.com'
      }
      /* payload: {
        operation: 'create',
        customObjectName: 'test'
      } as unknown */
    })
  })
})
