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

    it('retries when LinkedIn returns a non-2xx overall response', async () => {
      nock(BASE_URL).post(`/dmpSegments/${SEGMENT_ID}/companies`).reply(404, {})

      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { action: 'ADD', ...hookOutputs }
        })
      ).rejects.toThrow('This batch will be retried')
    })
  })

  describe('performBatch', () => {
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
