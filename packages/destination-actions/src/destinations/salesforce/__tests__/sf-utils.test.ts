import { GenericPayload } from '../sf-types'
import { buildCSVData } from '../sf-utils'

describe('Salesforce Utils', () => {
  describe('CSV', () => {
    it('should correctly build a CSV from payloads with complete data', async () => {
      const completePayloads: GenericPayload[] = [
        {
          operation: 'upsert',
          enable_batching: true,
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '00'
          },
          name: 'SpongeBob SquarePants',
          email: 'sponge@seamail.com',
          phone: '555-555-5555'
        },
        {
          operation: 'upsert',
          enable_batching: true,
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
          operation: 'upsert',
          enable_batching: true,
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
          operation: 'upsert',
          enable_batching: true,
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '01'
          },
          name: 'Patrick Star',
          phone: '123-456-7890'
        },
        {
          operation: 'upsert',
          enable_batching: true,
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
          operation: 'upsert',
          enable_batching: true,
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
          operation: 'upsert',
          enable_batching: true,
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

    it('should correctly build an update CSV', async () => {
      const updatePayloads: GenericPayload[] = [
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '00',
          name: 'SpongeBob Squarepants',
          phone: '1234567890',
          description: 'Krusty Krab'
        },
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '01',
          name: 'Squidward Tentacles',
          phone: '1234567891',
          description: 'Krusty Krab'
        }
      ]

      const csv = buildCSVData(updatePayloads, 'Id')
      const expected = `Name,Phone,Description,Id\n"SpongeBob Squarepants","1234567890","Krusty Krab","00"\n"Squidward Tentacles","1234567891","Krusty Krab","01"\n`

      expect(csv).toEqual(expected)
    })

    it('should correctly build an update CSV with incomplete data', async () => {
      const incompleteUpdatePayloads: GenericPayload[] = [
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '00',
          name: 'SpongeBob Squarepants',
          phone: '1234567890'
        },
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '01',
          name: 'Squidward Tentacles',
          description: 'Krusty Krab'
        }
      ]

      const csv = buildCSVData(incompleteUpdatePayloads, 'Id')
      const expected = `Name,Description,Phone,Id\n"SpongeBob Squarepants",#N/A,"1234567890","00"\n"Squidward Tentacles","Krusty Krab",#N/A,"01"\n`

      expect(csv).toEqual(expected)
    })

    it('should handle null data correctly', async () => {
      const nullPayloads: GenericPayload[] = [
        {
          operation: 'upsert',
          enable_batching: true,
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '00'
          },
          name: 'SpongeBob Squarepants',
          description: undefined
        },
        {
          operation: 'upsert',
          enable_batching: true,
          bulkUpsertExternalId: {
            externalIdName: 'test__c',
            externalIdValue: '01'
          },
          name: 'Squidward Tentacles',
          description: undefined
        }
      ]

      const csv = buildCSVData(nullPayloads, 'test__c')
      const expected = `Name,Description,test__c\n"SpongeBob Squarepants",#N/A,"00"\n"Squidward Tentacles",#N/A,"01"\n`

      expect(csv).toEqual(expected)
    })

    it('should correctly escape double quotes', async () => {
      const updatePayloads: GenericPayload[] = [
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '00',
          name: 'Sponge ""Bob"" "Square" "pants"'
        },
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '01',
          name: 'Tentacles, "Squidward"',
          description:
            'Squidward Tentacles is a fictional character in the American animated television series "SpongeBob SquarePants".\n He is voiced by actor Rodger Bumpass and first appeared on television in the series\' pilot episode on May 1, 1999.'
        }
      ]

      const csv = buildCSVData(updatePayloads, 'Id')
      const expected = `Name,Description,Id\n"Sponge """"Bob"""" ""Square"" ""pants""",#N/A,"00"\n"Tentacles, ""Squidward""","Squidward Tentacles is a fictional character in the American animated television series ""SpongeBob SquarePants"".\n He is voiced by actor Rodger Bumpass and first appeared on television in the series' pilot episode on May 1, 1999.","01"\n`
      expect(csv).toEqual(expected)
    })

    it('should handle numeric data correctly', async () => {
      const updatePayloads: GenericPayload[] = [
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '00',
          name: 'Krusty Krab',
          number_of_employees: 2
        },
        {
          operation: 'update',
          enable_batching: true,
          bulkUpdateRecordId: '01',
          name: 'Chum Bucket',
          number_of_employees: 1
        }
      ]

      const csv = buildCSVData(updatePayloads, 'Id')
      const expected = `Name,NumberOfEmployees,Id\n"Krusty Krab","2","00"\n"Chum Bucket","1","01"\n`
      expect(csv).toEqual(expected)
    })
  })
})
