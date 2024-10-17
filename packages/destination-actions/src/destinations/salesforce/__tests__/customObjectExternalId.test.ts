import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.salesforce.com'
}

describe('Salesforce', () => {
  describe('Custom Object by External Id', () => {
    it('Should end events successfully', () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Create Custom Object',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          last_name: 'Squarepants'
        }
      })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/TestCustom__c').reply(201, {})
      return testDestination.testAction('customObjectExternalId', {
        event,
        settings,
        mapping: {
          operation: 'create',
          customObjectName: 'TestCustom__c',
          externalIdField: 'email',
          externalIdValue: ''
        }
      })
    })
  })
})
