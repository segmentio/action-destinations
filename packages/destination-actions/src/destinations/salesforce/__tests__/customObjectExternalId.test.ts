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
    it('Should end events successfully', async () => {
      const customObjectName = 'TestCustom__c'
      const objectExternalId = 'Prospect__c'
      const externalIdValue = '123456-7890-ABCD-0123-45678901234567'
      const event = createTestEvent({
        type: 'track',
        event: 'Create Custom Object',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          last_name: 'Squarepants',
          object_type: objectExternalId
        },
        userId: externalIdValue
      })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`)
        .patch(`/${customObjectName}/${objectExternalId}/${externalIdValue}`)
        .reply(200, {})

      const responses = await testDestination.testAction('customObjectExternalId', {
        event,
        settings,
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          operation: 'create',
          customObjectName: customObjectName,
          externalIdField: {
            '@path': '$.properties.object_type'
          },
          externalIdValue: {
            '@path': '$.userId'
          },
          customFields: {
            '@path': '$.properties'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
