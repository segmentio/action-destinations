import { GenericPayload } from '../sf-types'
import { buildCSVData } from '../sf-utils'

describe('Salesforce Utils', () => {
  describe('CSV', () => {
    it('should correctly build a CSV from payloads with complete data', async () => {
      const completePayloads: GenericPayload[] = [
        {
          operation: 'bulkUpsert',
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '00'
          },
          name: 'SpongeBob SquarePants',
          email: 'sponge@seamail.com',
          phone: '555-555-5555'
        },
        {
          operation: 'bulkUpsert',
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '01'
          },
          name: 'Patrick Star',
          email: 'star@seamail.com',
          phone: '555-555-5555'
        }
      ]

      const csv = buildCSVData(completePayloads, 'test__c')
      const expected = `Name,Email,Phone,test__c\n"SpongeBob SquarePants","sponge@seamail.com","555-555-5555","00"\n"Patrick Star","star@seamail.com","555-555-5555","01"\n`

      expect(csv).toEqual(expected)
    })
    it('should correctly build a CSV from payloads with incomplete data', async () => {
      const incompletePayloads: GenericPayload[] = [
        {
          operation: 'bulkUpsert',
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '00'
          },
          name: 'SpongeBob Squarepants',
          email: 'sponge@seamail.com',
          customFields: {
            FavoriteFood: 'Krabby Patty'
          }
        },
        {
          operation: 'bulkUpsert',
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '01'
          },
          name: 'Patrick Star',
          phone: '123-456-7890'
        },
        {
          operation: 'bulkUpsert',
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '11'
          },
          name: 'Sandy Cheeks',
          mailing_state: 'Texas'
        }
      ]

      const csv = buildCSVData(incompletePayloads, 'test__c')
      const expected = `Name,MailingState,Phone,Email,FavoriteFood,test__c\n"SpongeBob Squarepants",#N/A,#N/A,"sponge@seamail.com","Krabby Patty","00"\n"Patrick Star",#N/A,"123-456-7890",#N/A,#N/A,"01"\n"Sandy Cheeks","Texas",#N/A,#N/A,#N/A,"11"\n`

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
