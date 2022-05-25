import { GenericPayload } from '../sf-types'
import { buildCSVData } from '../sf-utils'

describe('Salesforce Utils', () => {
  describe('CSV', () => {
    it('should correctly build a CSV from many payloads with incomplete data', async () => {
      const incompletePayloads: GenericPayload[] = [
        {
          operation: 'bulkUpsert',
          traits: {
            externalIdFieldName: 'test__c',
            externalIdFieldValue: '00'
          },
          name: 'SpongeBob Squarepants',
          email: 'sponge@seamail.com',
          customFields: {
            FavoriteFood: 'Krabby Patty'
          }
        },
        {
          operation: 'bulkUpsert',
          traits: {
            externalIdFieldName: 'test__c',
            externalIdFieldValue: '01'
          },
          name: 'Patrick Star',
          phone: '123-456-7890'
        },
        {
          operation: 'bulkUpsert',
          traits: {
            externalIdFieldName: 'test__c',
            externalIdFieldValue: '11'
          },
          name: 'Sandy Cheeks',
          state: 'Texas'
        }
      ]

      const csv = buildCSVData(incompletePayloads, 'test__c')
      const expected = `name,state,phone,email,FavoriteFood,test__c\n"SpongeBob Squarepants",#N/A,#N/A,"sponge@seamail.com","Krabby Patty","00"\n"Patrick Star",#N/A,"123-456-7890",#N/A,#N/A,"01"\n"Sandy Cheeks","Texas",#N/A,#N/A,#N/A,"11"\n`

      expect(csv).toEqual(expected)
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
