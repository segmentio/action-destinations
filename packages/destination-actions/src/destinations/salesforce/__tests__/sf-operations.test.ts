import nock from 'nock'
import createRequestClient from '../../../../../core/src/create-request-client'
import Salesforce from '../sf-operations'
import { API_VERSION } from '../sf-operations'
import type { GenericPayload } from '../sf-types'

const settings = {
  instanceUrl: 'https://test.salesforce.com/'
}

const requestClient = createRequestClient()

afterEach(() => {
  if (!nock.isDone()) {
    throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
  }
  nock.cleanAll()
})

describe('Salesforce', () => {
  describe('Operations', () => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, requestClient)

    it('should lookup based on a single trait', async () => {
      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE email = 'sponge@seamail.com'`)

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            email: 'sponge@seamail.com'
          }
        },
        'Lead'
      )
    })

    it('should lookup based on a single trait of type number', async () => {
      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE NumberOfEmployees = 2`)

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            NumberOfEmployees: 2
          }
        },
        'Lead'
      )
    })

    it('should lookup based on multiple traits', async () => {
      const query = encodeURIComponent(
        `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR company = 'Krusty Krab'`
      )
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            email: 'sponge@seamail.com',
            company: 'Krusty Krab'
          }
        },
        'Lead'
      )
    })

    it('should lookup based on multiple traits of different datatypes', async () => {
      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR isDeleted = false`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            email: 'sponge@seamail.com',
            isDeleted: false
          }
        },
        'Lead'
      )
    })

    it('should create SOQL WHERE conditon based on the datatype of trait value', async () => {
      const query = encodeURIComponent(
        `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR isDeleted = false OR NumberOfEmployees = 3`
      )
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            email: 'sponge@seamail.com',
            isDeleted: false,
            NumberOfEmployees: 3
          }
        },
        'Lead'
      )
    })

    it('should support the AND soql operator', async () => {
      const query = encodeURIComponent(
        `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' AND isDeleted = false AND NumberOfEmployees = 3`
      )
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          recordMatcherOperator: 'AND',
          traits: {
            email: 'sponge@seamail.com',
            isDeleted: false,
            NumberOfEmployees: 3
          }
        },
        'Lead'
      )
    })

    it('should fail when the soql operator is not OR and not AND', async () => {
      await expect(
        sf.updateRecord(
          {
            recordMatcherOperator: 'NOR',
            traits: {
              email: { key: 'sponge@seamail.com' },
              NoOfEmployees: [1, 2]
            }
          },
          'Lead'
        )
      ).rejects.toThrowError('Invalid SOQL operator - NOR')
    })

    it('should fail when trait value is of an unsupported datatype - object or arrays', async () => {
      await expect(
        sf.updateRecord(
          {
            traits: {
              email: { key: 'sponge@seamail.com' },
              NoOfEmployees: [1, 2]
            }
          },
          'Lead'
        )
      ).rejects.toThrowError('Unsupported datatype for record matcher traits - object')
    })

    it('should fail when a record is not found', async () => {
      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE email = 'sponge@seamail.com'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        totalSize: 0
      })

      await expect(
        sf.updateRecord(
          {
            traits: {
              email: 'sponge@seamail.com'
            }
          },
          'Lead'
        )
      ).rejects.toThrowError('No record found with given traits')
    })

    it('should fail when multiple records are found', async () => {
      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE email = 'sponge@seamail.com'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        totalSize: 15
      })

      await expect(
        sf.updateRecord(
          {
            traits: {
              email: 'sponge@seamail.com'
            }
          },
          'Lead'
        )
      ).rejects.toThrowError('Multiple records returned with given traits')
    })

    describe('upsert', () => {
      it('should create a new record when no records are found', async () => {
        const query = encodeURIComponent(
          `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR company = 'Krusty Krab'`
        )
        nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
          totalSize: 0
        })

        nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

        await sf.upsertRecord(
          {
            traits: {
              email: 'sponge@seamail.com',
              company: 'Krusty Krab'
            },
            company: 'Krusty Krab LLC',
            last_name: 'Krabs'
          },
          'Lead'
        )
      })

      it('should fail when multiple records are found', async () => {
        const query = encodeURIComponent(
          `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR company = 'Krusty Krab'`
        )
        nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
          totalSize: 10
        })

        await expect(
          sf.upsertRecord(
            {
              traits: {
                email: 'sponge@seamail.com',
                company: 'Krusty Krab'
              },
              company: 'Krusty Krab LLC',
              last_name: 'Krabs'
            },
            'Lead'
          )
        ).rejects.toThrowError('Multiple records returned with given traits')
      })

      it('should update an existing record if one is found', async () => {
        const query = encodeURIComponent(
          `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR company = 'Krusty Krab'`
        )
        nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
          .get(`/?q=${query}`)
          .reply(201, {
            Id: 'abc123',
            totalSize: 1,
            records: [{ Id: '123456' }]
          })

        nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

        await sf.upsertRecord(
          {
            traits: {
              email: 'sponge@seamail.com',
              company: 'Krusty Krab'
            },
            company: 'Krusty Krab LLC',
            last_name: 'Krabs'
          },
          'Lead'
        )
      })

      it('should fail when traits is falsy', async () => {
        await expect(
          sf.upsertRecord({ company: 'Krusty Krab', last_name: 'Krusty Krab' }, 'Lead')
        ).rejects.toThrowError('Undefined Traits when using upsert operation')

        await expect(
          sf.upsertRecord(
            {
              traits: {},
              company: 'Krusty Krab',
              last_name: 'Krabs'
            },
            'Lead'
          )
        ).rejects.toThrowError('Undefined Traits when using upsert operation')

        await expect(
          sf.upsertRecord(
            {
              traits: undefined,
              company: 'Krusty Krab',
              last_name: 'Krabs'
            },
            'Lead'
          )
        ).rejects.toThrowError('Undefined Traits when using upsert operation')
      })

      it('should properly escape quotes in a record matcher', async () => {
        const query = encodeURIComponent(
          `SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR company = 'Krusty\\'s Krab'`
        )
        nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
          .get(`/?q=${query}`)
          .reply(201, {
            Id: 'abc123',
            totalSize: 1,
            records: [{ Id: '123456' }]
          })

        nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

        await sf.upsertRecord(
          {
            traits: {
              email: 'sponge@seamail.com',
              company: "Krusty's Krab"
            },
            company: 'Krusty Krab LLC',
            last_name: 'Krabs'
          },
          'Lead'
        )
      })

      it('should properly remove invalid characters from field name in lookups', async () => {
        const query = encodeURIComponent(
          `SELECT Id FROM Lead WHERE email__cs = 'sponge@seamail.com' OR company = 'Krusty\\'s Krab'`
        )
        nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
          .get(`/?q=${query}`)
          .reply(201, {
            Id: 'abc123',
            totalSize: 1,
            records: [{ Id: '123456' }]
          })

        nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

        await sf.upsertRecord(
          {
            traits: {
              "email__c's!'": 'sponge@seamail.com',
              company: "Krusty's Krab"
            },
            company: 'Krusty Krab LLC',
            last_name: 'Krabs'
          },
          'Lead'
        )
      })
    })
  })

  describe('Bulk Operations', () => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, requestClient)

    const bulkUpsertPayloads: GenericPayload[] = [
      {
        operation: 'upsert',
        enable_batching: true,
        bulkUpsertExternalId: {
          externalIdName: 'test__c',
          externalIdValue: 'ab'
        },
        name: 'SpongeBob Squarepants',
        phone: '1234567890',
        description: 'Krusty Krab'
      },
      {
        operation: 'upsert',
        enable_batching: true,
        bulkUpsertExternalId: {
          externalIdName: 'test__c',
          externalIdValue: 'cd'
        },
        name: 'Squidward Tentacles',
        phone: '1234567891',
        description: 'Krusty Krab'
      }
    ]

    const customPayloads: GenericPayload[] = [
      {
        operation: 'upsert',
        enable_batching: true,
        bulkUpsertExternalId: {
          externalIdName: 'test__c',
          externalIdValue: 'ab'
        },
        name: 'SpongeBob Squarepants',
        phone: '1234567890',
        description: 'Krusty Krab',
        customFields: {
          TickerSymbol: 'KRAB'
        }
      },
      {
        operation: 'upsert',
        enable_batching: true,
        bulkUpsertExternalId: {
          externalIdName: 'test__c',
          externalIdValue: 'cd'
        },
        name: 'Squidward Tentacles',
        phone: '1234567891',
        description: 'Krusty Krab',
        customFields: {
          TickerSymbol: 'KRAB'
        }
      }
    ]

    const bulkUpdatePayloads: GenericPayload[] = [
      {
        operation: 'update',
        enable_batching: true,
        bulkUpdateRecordId: 'ab',
        name: 'SpongeBob Squarepants',
        phone: '1234567890',
        description: 'Krusty Krab'
      },
      {
        operation: 'update',
        enable_batching: true,
        bulkUpdateRecordId: 'cd',
        name: 'Squidward Tentacles',
        phone: '1234567891',
        description: 'Krusty Krab'
      }
    ]

    it('should correctly upsert a batch of records', async () => {
      //create bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest`)
        .post('', {
          object: 'Account',
          externalIdFieldName: 'test__c',
          operation: 'upsert',
          contentType: 'CSV'
        })
        .reply(201, {
          id: 'abc123'
        })

      const CSV = `Name,Phone,Description,test__c\n"SpongeBob Squarepants","1234567890","Krusty Krab","ab"\n"Squidward Tentacles","1234567891","Krusty Krab","cd"\n`

      //upload csv
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/abc123/batches`, {
        reqheaders: {
          'Content-Type': 'text/csv',
          Accept: 'application/json'
        }
      })
        .put('', CSV)
        .reply(201, {})

      //close bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/abc123`)
        .patch('', {
          state: 'UploadComplete'
        })
        .reply(201, {})

      await sf.bulkHandler(bulkUpsertPayloads, 'Account')
    })

    it('should correctly parse the customFields object', async () => {
      //create bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest`)
        .post('', {
          object: 'Account',
          externalIdFieldName: 'test__c',
          operation: 'upsert',
          contentType: 'CSV'
        })
        .reply(201, {
          id: 'xyz987'
        })

      const CSV = `Name,Phone,Description,TickerSymbol,test__c\n"SpongeBob Squarepants","1234567890","Krusty Krab","KRAB","ab"\n"Squidward Tentacles","1234567891","Krusty Krab","KRAB","cd"\n`

      //upload csv
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/xyz987/batches`, {
        reqheaders: {
          'Content-Type': 'text/csv',
          Accept: 'application/json'
        }
      })
        .put('', CSV)
        .reply(201, {})

      //close bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/xyz987`)
        .patch('', {
          state: 'UploadComplete'
        })
        .reply(201, {})

      await sf.bulkHandler(customPayloads, 'Account')
    })

    it('should correctly update a batch of records', async () => {
      //create bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest`)
        .post('', {
          object: 'Account',
          externalIdFieldName: 'Id',
          operation: 'update',
          contentType: 'CSV'
        })
        .reply(201, {
          id: 'abc123'
        })

      const CSV = `Name,Phone,Description,Id\n"SpongeBob Squarepants","1234567890","Krusty Krab","ab"\n"Squidward Tentacles","1234567891","Krusty Krab","cd"\n`

      //upload csv
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/abc123/batches`, {
        reqheaders: {
          'Content-Type': 'text/csv',
          Accept: 'application/json'
        }
      })
        .put('', CSV)
        .reply(201, {})

      //close bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/abc123`)
        .patch('', {
          state: 'UploadComplete'
        })
        .reply(201, {})

      await sf.bulkHandler(bulkUpdatePayloads, 'Account')
    })

    it('should pass NO_VALUE when a bulk record ID is missing', async () => {
      const missingRecordPayload = {
        operation: 'update',
        enable_batching: true,
        bulkUpdateRecordId: undefined,
        name: 'Plankton',
        phone: '123-evil',
        description: 'Proprietor of the 1 star restaurant, The Chum Bucket'
      }

      //create bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest`)
        .post('', {
          object: 'Account',
          externalIdFieldName: 'Id',
          operation: 'update',
          contentType: 'CSV'
        })
        .reply(201, {
          id: 'abc123'
        })

      const CSV = `Name,Phone,Description,Id\n"SpongeBob Squarepants","1234567890","Krusty Krab","ab"\n"Squidward Tentacles","1234567891","Krusty Krab","cd"\n"Plankton","123-evil","Proprietor of the 1 star restaurant, The Chum Bucket","#N/A"\n`

      //upload csv
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/abc123/batches`, {
        reqheaders: {
          'Content-Type': 'text/csv',
          Accept: 'application/json'
        }
      })
        .put('', CSV)
        .reply(201, {})

      //close bulk job
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/jobs/ingest/abc123`)
        .patch('', {
          state: 'UploadComplete'
        })
        .reply(201, {})

      await sf.bulkHandler([...bulkUpdatePayloads, missingRecordPayload], 'Account')
    })

    it('should fail if the bulkHandler is triggered but enable_batching is not true', async () => {
      const payloads: GenericPayload[] = [
        {
          operation: 'upsert',
          enable_batching: false,
          name: 'SpongeBob Squarepants',
          phone: '1234567890',
          description: 'Krusty Krab'
        },
        {
          operation: 'upsert',
          enable_batching: false,
          name: 'Squidward Tentacles',
          phone: '1234567891',
          description: 'Krusty Krab'
        }
      ]

      await expect(sf.bulkHandler(payloads, 'Account')).rejects.toThrow(
        'Bulk operation triggered where enable_batching is false.'
      )
    })
  })
})
