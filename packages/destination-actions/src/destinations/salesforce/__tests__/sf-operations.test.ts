import nock from 'nock'
import createRequestClient from '../../../../../core/src/create-request-client'
import Salesforce from '../sf-operations'
import { API_VERSION } from '../sf-operations'
import type { GenericPayload } from '../sf-types'

const settings = {
  instanceUrl: 'https://test.com/'
}

const requestClient = createRequestClient()

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

  describe.only('Bulk Operations', () => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, requestClient)

    const bulkUpsertPayloads: GenericPayload[] = [
      {
        operation: 'bulkUpsert',
        traits: {
          externalIdFieldName: 'test__c',
          externalIdFieldValue: 'ab'
        },
        name: 'SpongeBob Squarepants',
        phone: '1234567890',
        description: 'Krusty Krab'
      },
      {
        operation: 'bulkUpsert',
        traits: {
          externalIdFieldName: 'test__c',
          externalIdFieldValue: 'cd'
        },
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

      const CSV = `"Name","Phone","Description","test__c"\n"SpongeBob Squarepants","1234567890","Krusty Krab","ab"\n"Squidward Tentacles","1234567891","Krusty Krab","cd"`

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

      await sf.bulkUpsert(bulkUpsertPayloads, 'Account')
    })
  })
})
