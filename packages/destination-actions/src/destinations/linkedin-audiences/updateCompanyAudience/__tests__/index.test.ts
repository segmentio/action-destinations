import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import createRequestClient from '../../../../../../core/src/create-request-client'
import Destination from '../../index'
import { BASE_URL } from '../../constants'
import { toOrganizationUrn } from '../functions'
import { performCompanyHook, getCompanyAudiences } from '../hooks'
import type { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const settings: Settings = {
  ad_account_id: '12345',
  send_email: true,
  send_google_advertising_id: true
}

const SEGMENT_ID = 'dmp_segment_id'
const auth = { accessToken: 'token', refreshToken: 'refresh' }

// A plain RequestClient used to exercise the hook helpers directly (there is no testHook helper
// in the framework). nock matches on URL/body, so the auth header from extendRequest is not needed.
const requestClient = createRequestClient()

const hookOutputs = {
  retlOnMappingSave: {
    inputs: {},
    outputs: { id: SEGMENT_ID, name: 'My ABM Audience' }
  }
}

// Full explicit mapping for executeBatch, which (unlike testBatchAction) does not apply useDefaultMappings.
const batchMapping = {
  action: 'ADD',
  identifiers: {
    companyDomain: { '@path': '$.traits.company_domain' },
    linkedInCompanyId: { '@path': '$.traits.linkedin_company_id' }
  },
  ...hookOutputs
}

describe('LinkedinAudiences.updateCompanyAudience', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('toOrganizationUrn', () => {
    it('wraps a bare organization id into a URN', () => {
      expect(toOrganizationUrn('1035')).toBe('urn:li:organization:1035')
    })
    it('passes through a value that is already a URN', () => {
      expect(toOrganizationUrn('urn:li:organization:1035')).toBe('urn:li:organization:1035')
    })
  })

  describe('perform', () => {
    it('adds a single company with both identifiers', async () => {
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      const responses = await testDestination.testAction('updateCompanyAudience', {
        event: {
          type: 'track',
          traits: { company_domain: 'microsoft.com', linkedin_company_id: '1035' }
        } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: {
          action: 'ADD',
          ...hookOutputs
        }
      })

      expect(responses[0].status).toBe(200)
      expect(sentBody).toEqual({
        elements: [
          {
            action: 'ADD',
            companyWebsiteDomain: 'microsoft.com',
            organizationUrn: 'urn:li:organization:1035'
          }
        ]
      })
    })

    it('sends only the provided identifier (domain only)', async () => {
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { action: 'ADD', ...hookOutputs }
      })

      expect(sentBody.elements[0]).toEqual({ action: 'ADD', companyWebsiteDomain: 'microsoft.com' })
    })

    it('sends REMOVE when the action field is Remove', async () => {
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { action: 'REMOVE', ...hookOutputs }
      })

      expect(sentBody.elements[0].action).toBe('REMOVE')
    })

    it('throws when no company audience is connected (no hook output)', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { action: 'ADD' }
        })
      ).rejects.toThrow('No LinkedIn Company Audience is connected to this mapping')
    })

    it('throws a validation error when no identifier is provided', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: {} } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { action: 'ADD', identifiers: {}, ...hookOutputs }
        })
      ).rejects.toThrow("At least one of 'Company Domain' or 'LinkedIn Company ID' is required")
    })

    const performWithStatus = (status: number) => {
      nock(BASE_URL).post(`/dmpSegments/${SEGMENT_ID}/companies`).reply(status, {})
      return testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { action: 'ADD', ...hookOutputs }
      })
    }

    it('throws a retryable error on 429 (rate limit)', async () => {
      const error = await performWithStatus(429).catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(429)
    })

    it('throws a retryable error on 500', async () => {
      const error = await performWithStatus(500).catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(500)
    })

    it('throws InvalidAuthenticationError on 401 so the token can be refreshed', async () => {
      const error = await performWithStatus(401).catch((e) => e)
      expect(error.code).toBe('INVALID_AUTHENTICATION')
    })

    it('throws a non-retryable error on 400 (malformed request)', async () => {
      const error = await performWithStatus(400).catch((e) => e)
      expect(error.code).not.toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(400)
    })

    it('throws a non-retryable error on 404 (segment not found)', async () => {
      const error = await performWithStatus(404).catch((e) => e)
      expect(error.code).not.toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(404)
    })
  })

  describe('performBatch', () => {
    it('dedupes same-company payloads and fans each result back to every original index', async () => {
      // The 10 valid rows below collapse to 4 unique company+action elements. Case, surrounding
      // whitespace, and bare-id-vs-URN forms of the same company all key the same:
      //   Adobe (idx 0,3,6,11), oracle.com (idx 1,8), org 1476 (idx 4,9), ibm.com (idx 5,10).
      // LinkedIn is sent exactly 4 elements; its per-element result is copied to every original
      // index in that group, and the two no-identifier rows (idx 2,7) fail before the request.
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, {
          elements: [
            { status: 201 }, // Adobe
            { status: 201 }, // oracle.com
            { status: 400, error: { message: 'Invalid organization urn' } }, // org 1476
            { status: 201 } // ibm.com
          ]
        })

      const perEventMapping = {
        action: { '@path': '$.traits.action' },
        identifiers: {
          companyDomain: { '@path': '$.traits.company_domain' },
          linkedInCompanyId: { '@path': '$.traits.linkedin_company_id' }
        },
        ...hookOutputs
      }

      const events = [
        { type: 'track', traits: { company_domain: 'Adobe.com', linkedin_company_id: '1480', action: 'ADD' } },
        { type: 'track', traits: { company_domain: 'oracle.com', action: 'ADD' } },
        { type: 'track', traits: { action: 'ADD' } },
        {
          type: 'track',
          traits: { company_domain: 'adobe.com', linkedin_company_id: 'urn:li:organization:1480', action: 'ADD' }
        },
        { type: 'track', traits: { linkedin_company_id: '1476', action: 'ADD' } },
        { type: 'track', traits: { company_domain: 'ibm.com', action: 'ADD' } },
        { type: 'track', traits: { company_domain: 'ADOBE.COM', linkedin_company_id: '1480', action: 'ADD' } },
        { type: 'track', traits: { action: 'REMOVE' } },
        { type: 'track', traits: { company_domain: ' oracle.com ', action: 'ADD' } },
        { type: 'track', traits: { linkedin_company_id: 'urn:li:organization:1476', action: 'ADD' } },
        { type: 'track', traits: { company_domain: 'IBM.com', action: 'ADD' } },
        { type: 'track', traits: { company_domain: 'adobe.com', linkedin_company_id: '1480', action: 'ADD' } }
      ] as any

      const response = await testDestination.executeBatch('updateCompanyAudience', {
        events,
        settings,
        auth,
        mapping: perEventMapping
      })

      // Only 4 unique elements are sent to LinkedIn despite 12 input rows.
      expect(sentBody).toEqual({
        elements: [
          { action: 'ADD', companyWebsiteDomain: 'Adobe.com', organizationUrn: 'urn:li:organization:1480' },
          { action: 'ADD', companyWebsiteDomain: 'oracle.com' },
          { action: 'ADD', organizationUrn: 'urn:li:organization:1476' },
          { action: 'ADD', companyWebsiteDomain: 'ibm.com' }
        ]
      })

      const adobe = {
        status: 201,
        sent: { action: 'ADD', companyWebsiteDomain: 'Adobe.com', organizationUrn: 'urn:li:organization:1480' },
        body: { action: 'ADD', identifiers: { companyDomain: 'Adobe.com', linkedInCompanyId: '1480' }, index: 0 }
      }
      const oracle = {
        status: 201,
        sent: { action: 'ADD', companyWebsiteDomain: 'oracle.com' },
        body: { action: 'ADD', identifiers: { companyDomain: 'oracle.com' }, index: 1 }
      }
      const ibm = {
        status: 201,
        sent: { action: 'ADD', companyWebsiteDomain: 'ibm.com' },
        body: { action: 'ADD', identifiers: { companyDomain: 'ibm.com' }, index: 5 }
      }
      const org1476Error = {
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Invalid organization urn',
        sent: { action: 'ADD', organizationUrn: 'urn:li:organization:1476' },
        body: { action: 'ADD', identifiers: { linkedInCompanyId: '1476' }, index: 4 },
        errorreporter: 'DESTINATION'
      }
      const noIdentifier = (action: string) => ({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.",
        sent: { action, identifiers: {} },
        body: {},
        errorreporter: 'DESTINATION'
      })

      // Every original index gets a status; duplicate rows carry the representative's sent/body,
      // and the two members of the failed org-1476 group (idx 4, 9) both get the 400 error.
      expect(response).toEqual([
        adobe, // 0
        oracle, // 1
        noIdentifier('ADD'), // 2
        adobe, // 3 (dup of 0)
        org1476Error, // 4
        ibm, // 5
        adobe, // 6 (dup of 0)
        noIdentifier('REMOVE'), // 7
        oracle, // 8 (dup of 1, whitespace-normalized)
        org1476Error, // 9 (dup of 4, URN form)
        ibm, // 10 (dup of 5, case-normalized)
        adobe // 11 (dup of 0)
      ])
    })

    it('returns a per-item MultiStatusResponse for a mixed batch', async () => {
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`)
        .reply(200, {
          elements: [{ status: 201 }, { status: 400, error: { message: 'Invalid company' } }]
        })

      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com' } },
        { type: 'track', traits: { company_domain: 'invalid' } }
      ] as any

      const response = await testDestination.executeBatch('updateCompanyAudience', {
        events,
        settings,
        auth,
        mapping: batchMapping
      })

      expect(response[0].status).toBe(201)
      expect(response[1].status).toBe(400)
      expect((response[1] as any).errormessage).toBe('Invalid company')

      // sent = the element sent to LinkedIn; body = the Segment payload into performBatch
      expect((response[0] as any).sent).toEqual({ action: 'ADD', companyWebsiteDomain: 'microsoft.com' })
      expect((response[0] as any).body).toMatchObject({ identifiers: { companyDomain: 'microsoft.com' } })
      expect((response[1] as any).sent).toEqual({ action: 'ADD', companyWebsiteDomain: 'invalid' })
      expect((response[1] as any).body).toMatchObject({ identifiers: { companyDomain: 'invalid' } })
    })

    it('marks payloads with no identifier as per-item errors without failing the batch', async () => {
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`)
        .reply(200, { elements: [{ status: 201 }] })

      const events = [
        { type: 'track', traits: {} },
        { type: 'track', traits: { company_domain: 'microsoft.com' } }
      ] as any

      const response = await testDestination.executeBatch('updateCompanyAudience', {
        events,
        settings,
        auth,
        mapping: batchMapping
      })

      expect(response[0].status).toBe(400)
      expect((response[0] as any).errormessage).toContain("At least one of 'Company Domain'")
      expect(response[1].status).toBe(201)
    })

    it('fails a payload non-retryably when LinkedIn returns fewer results than sent', async () => {
      // Two companies sent, but LinkedIn returns only one element in the 200 body.
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`)
        .reply(200, { elements: [{ status: 201 }] })

      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com' } },
        { type: 'track', traits: { company_domain: 'segment.com' } }
      ] as any

      const response = await testDestination.executeBatch('updateCompanyAudience', {
        events,
        settings,
        auth,
        mapping: batchMapping
      })

      expect(response[0].status).toBe(201)
      expect(response[1].status).toBe(400)
      expect((response[1] as any).errormessage).toContain('did not return a result')
    })
  })

  describe('hook: performCompanyHook', () => {
    it('creates a new COMPANY segment and returns the id from the x-restli-id header', async () => {
      nock(BASE_URL)
        .post('/dmpSegments', (body) => body.type === 'COMPANY' && body.name === 'My New Audience')
        .reply(201, {}, { 'x-restli-id': 'new_segment_id' })

      const result = await performCompanyHook(requestClient, settings, { segment_creation_name: 'My New Audience' })

      expect(result).toEqual({
        successMessage: expect.stringContaining('new_segment_id'),
        savedData: { id: 'new_segment_id', name: 'My New Audience' }
      })
    })

    it('validates and reuses a selected existing COMPANY segment', async () => {
      nock(BASE_URL).get('/dmpSegments/999').reply(200, { id: '999', name: 'Existing ABM', type: 'COMPANY' })

      const result = await performCompanyHook(requestClient, settings, { existing_audience_id: '999' })

      expect(result).toEqual({
        successMessage: expect.stringContaining('Existing ABM'),
        savedData: { id: '999', name: 'Existing ABM' }
      })
    })

    it('rejects a selected segment that is not a COMPANY segment', async () => {
      nock(BASE_URL).get('/dmpSegments/999').reply(200, { id: '999', name: 'A User List', type: 'USER' })

      const result = await performCompanyHook(requestClient, settings, { existing_audience_id: '999' })

      expect(result).toEqual({
        error: {
          message: expect.stringContaining('cannot be used as a Company Audience'),
          code: 'INVALID_SEGMENT_TYPE'
        }
      })
    })

    it('returns an error when neither an existing id nor a name is provided', async () => {
      const result = await performCompanyHook(requestClient, settings, {})
      expect(result).toEqual({
        error: { message: expect.stringContaining('Provide a name'), code: 'MISSING_SEGMENT_NAME' }
      })
    })
  })

  describe('hook dropdown: getCompanyAudiences', () => {
    it('lists only COMPANY-type segments as choices', async () => {
      nock(BASE_URL)
        .get('/dmpSegments')
        .query(true)
        .reply(200, {
          elements: [
            { id: '1', name: 'Company Aud', type: 'COMPANY' },
            { id: '2', name: 'User Aud', type: 'USER' },
            { id: '3', name: 'Another Company', type: 'COMPANY' }
          ]
        })

      const result = await getCompanyAudiences(requestClient, settings)

      expect(result).toEqual({
        choices: [
          { value: '1', label: 'Company Aud' },
          { value: '3', label: 'Another Company' }
        ]
      })
    })
  })
})
