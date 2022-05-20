import { GenericPayload } from '../sf-types'
import { buildCSVData } from '../sf-utils'

describe('Salesforce Utils', () => {
  describe('CSV', () => {
    it('should correctly build a CSV from many payloads with incomplete data', async () => {
      //todo
      return true
    })

    it('should throw an error for invalid customFields', async () => {
      const invalidCustomFieldPayloads: GenericPayload[] = [
        {
          operation: 'bulkUpsert',
          traits: {
            externalIdFieldName: 'test__c',
            externalIdFieldValue: 'ab'
          },
          name: 'SpongeBob Squarepants',
          phone: '1234567890',
          description: 'Krusty Krab',
          customFields: {
            'a,weird,field': 'KRAB'
          }
        },
        {
          operation: 'bulkUpsert',
          traits: {
            externalIdFieldName: 'test__c',
            externalIdFieldValue: 'cd'
          },
          name: 'Squidward Tentacles',
          phone: '1234567891',
          description: 'Krusty Krab',
          customFields: {
            'a,weird,field': 'KRAB'
          }
        }
      ]

      expect(() => {
        buildCSVData(invalidCustomFieldPayloads, 'test__c')
      }).toThrowError(`Invalid character in field name: a,weird,field`)
    })
  })
})
