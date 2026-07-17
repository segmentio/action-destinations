import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'
import { toOrganizationUrn } from '../functions'
import type { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const settings: Settings = {
  ad_account_id: '12345',
  send_email: true,
  send_google_advertising_id: true
}

const SEGMENT_ID = 'dmp_segment_id'
const SOURCE_SEGMENT_ID = 'aud_key'
const auth = { accessToken: 'token', refreshToken: 'refresh' }

// The segment id is resolved at perform time by looking up the COMPANY segment for the
// resolved sourceSegmentId. Mock that GET so perform can proceed to the companies batch endpoint.
const mockLookup = (elements: Array<{ id: string; name: string; type: string }> = [
  { id: SEGMENT_ID, name: 'My ABM Audience', type: 'COMPANY' }
]) => {
  nock(BASE_URL).get('/dmpSegments').query(true).reply(200, { elements })
}

// Common mapping bits: identifiers come from traits. Audience Source defaults to Engage/Reverse ETL,
// so the lookup key comes from computation_key.
const baseMapping = {
  audience_source: 'ENGAGE_RETL',
  computation_key: SOURCE_SEGMENT_ID,
  identifiers: {
    companyDomain: { '@path': '$.traits.company_domain' },
    linkedInCompanyId: { '@path': '$.traits.linkedin_company_id' }
  }
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
      mockLookup()
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
        mapping: { dmp_company_action: 'ADD', ...baseMapping }
      })

      expect(responses[responses.length - 1].status).toBe(200)
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
      mockLookup()
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
        mapping: { dmp_company_action: 'ADD', ...baseMapping }
      })

      expect(sentBody.elements[0]).toEqual({ action: 'ADD', companyWebsiteDomain: 'microsoft.com' })
    })

    it('sends REMOVE when the action field is Remove', async () => {
      mockLookup()
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
        mapping: { dmp_company_action: 'REMOVE', ...baseMapping }
      })

      expect(sentBody.elements[0].action).toBe('REMOVE')
    })

    // The action is governed solely by the dmp_company_action field. Even when the inbound event
    // carries an Engage/RETL audience-membership boolean at properties[computation_key], that boolean
    // must be ignored — the customer's dmp_company_action selection wins.
    it('uses dmp_company_action=ADD even when the membership boolean says remove (false)', async () => {
      mockLookup()
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        // Engage-shaped event: membership boolean at properties.aud_key = false means "remove".
        event: {
          type: 'track',
          properties: { aud_key: false },
          context: { traits: { company_domain: 'microsoft.com' } }
        } as any,
        settings,
        auth,
        mapping: {
          dmp_company_action: 'ADD',
          audience_source: 'ENGAGE_RETL',
          computation_key: SOURCE_SEGMENT_ID,
          identifiers: { companyDomain: { '@path': '$.context.traits.company_domain' } }
        }
      })

      // Boolean says remove, but dmp_company_action says ADD — ADD must win.
      expect(sentBody.elements[0].action).toBe('ADD')
    })

    it('uses dmp_company_action=REMOVE even when the membership boolean says add (true)', async () => {
      mockLookup()
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        event: {
          type: 'track',
          properties: { aud_key: true },
          context: { traits: { company_domain: 'microsoft.com' } }
        } as any,
        settings,
        auth,
        mapping: {
          dmp_company_action: 'REMOVE',
          audience_source: 'ENGAGE_RETL',
          computation_key: SOURCE_SEGMENT_ID,
          identifiers: { companyDomain: { '@path': '$.context.traits.company_domain' } }
        }
      })

      expect(sentBody.elements[0].action).toBe('REMOVE')
    })

    it('follows dmp_company_action when no membership boolean is present in the payload', async () => {
      mockLookup()
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        // No properties[computation_key] at all — the action must not depend on it existing.
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { dmp_company_action: 'ADD', ...baseMapping }
      })

      expect(sentBody.elements[0].action).toBe('ADD')
    })

    it('creates a new COMPANY segment when the lookup returns no COMPANY match', async () => {
      // Lookup returns only a USER segment sharing the sourceSegmentId; it must be ignored and a
      // new COMPANY segment created. The new id comes back in the x-restli-id header.
      mockLookup([{ id: 'user_segment', name: 'A User List', type: 'USER' }])
      let createBody: any
      nock(BASE_URL)
        .post('/dmpSegments', (body) => {
          createBody = body
          return true
        })
        .reply(201, {}, { 'x-restli-id': 'created_company_id' })
      let sentBody: any
      nock(BASE_URL)
        .post(`/dmpSegments/created_company_id/companies`, (body) => {
          sentBody = body
          return true
        })
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { dmp_company_action: 'ADD', ...baseMapping }
      })

      // The resolved key (computation_key) doubles as the created segment's name and sourceSegmentId.
      expect(createBody).toMatchObject({
        type: 'COMPANY',
        name: SOURCE_SEGMENT_ID,
        sourceSegmentId: SOURCE_SEGMENT_ID
      })
      expect(sentBody.elements[0]).toEqual({ action: 'ADD', companyWebsiteDomain: 'microsoft.com' })
    })

    it('uses the customer-provided Segment Name as the lookup/create key when Audience Source is Connections', async () => {
      // Connections ignores computation_key; the Segment Name is used as name + sourceSegmentId.
      mockLookup([])
      let createBody: any
      nock(BASE_URL)
        .post('/dmpSegments', (body) => {
          createBody = body
          return true
        })
        .reply(201, {}, { 'x-restli-id': 'created_company_id' })
      nock(BASE_URL)
        .post(`/dmpSegments/created_company_id/companies`)
        .reply(200, { elements: [{ status: 201 }] })

      await testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: {
          dmp_company_action: 'ADD',
          audience_source: 'CONNECTIONS',
          segment_name: 'My Connections Audience',
          identifiers: { companyDomain: { '@path': '$.traits.company_domain' } }
        }
      })

      expect(createBody).toMatchObject({
        type: 'COMPANY',
        name: 'My Connections Audience',
        sourceSegmentId: 'My Connections Audience'
      })
    })

    it('throws a retryable error when the segment lookup returns a retryable status (500)', async () => {
      nock(BASE_URL).get('/dmpSegments').query(true).reply(500, {})
      const error = await testDestination
        .testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { dmp_company_action: 'ADD', ...baseMapping }
        })
        .catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
    })

    it('treats a 409 conflict on segment create as retryable', async () => {
      mockLookup([])
      nock(BASE_URL).post('/dmpSegments').reply(409, {})
      const error = await testDestination
        .testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { dmp_company_action: 'ADD', ...baseMapping }
        })
        .catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
    })

    it('throws a non-retryable error when segment create returns a 400', async () => {
      mockLookup([])
      nock(BASE_URL).post('/dmpSegments').reply(400, {})
      const error = await testDestination
        .testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { dmp_company_action: 'ADD', ...baseMapping }
        })
        .catch((e) => e)
      expect(error.code).not.toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(400)
    })

    // computation_key is conditionally required when audience_source is ENGAGE_RETL, so the
    // framework's schema validation rejects the payload before perform runs.
    it('throws a validation error when the computation_key is missing (Engage/Reverse ETL)', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: {
            dmp_company_action: 'ADD',
            audience_source: 'ENGAGE_RETL',
            identifiers: { companyDomain: { '@path': '$.traits.company_domain' } }
          }
        })
      ).rejects.toThrow("missing the required field 'computation_key'")
    })

    // segment_name is conditionally required when audience_source is CONNECTIONS.
    it('throws a validation error when Segment Name is missing (Connections)', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: {
            dmp_company_action: 'ADD',
            audience_source: 'CONNECTIONS',
            identifiers: { companyDomain: { '@path': '$.traits.company_domain' } }
          }
        })
      ).rejects.toThrow("missing the required field 'segment_name'")
    })

    // Whitespace-only values satisfy the schema's presence check but resolve to empty; the
    // runtime resolver (resolveSourceSegmentId) guards this case with a clearer message.
    it('throws a runtime validation error when the Audience Key is only whitespace', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: {
            dmp_company_action: 'ADD',
            audience_source: 'ENGAGE_RETL',
            computation_key: '   ',
            identifiers: { companyDomain: { '@path': '$.traits.company_domain' } }
          }
        })
      ).rejects.toThrow('`Audience Key` field is required')
    })

    it('throws a validation error when no identifier is provided', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: {} } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { dmp_company_action: 'ADD', ...baseMapping, identifiers: {} }
        })
      ).rejects.toThrow("At least one of 'Company Domain' or 'LinkedIn Company ID' is required")
    })

    const performWithStatus = (status: number) => {
      mockLookup()
      nock(BASE_URL).post(`/dmpSegments/${SEGMENT_ID}/companies`).reply(status, {})
      return testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { dmp_company_action: 'ADD', ...baseMapping }
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

    // LinkedIn's batch-style endpoint returns HTTP 200 even when the single company fails,
    // reporting the real outcome in elements[0].status. These cover that per-element check.
    const performWithElement = (body: unknown) => {
      mockLookup()
      nock(BASE_URL).post(`/dmpSegments/${SEGMENT_ID}/companies`).reply(200, body)
      return testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: { company_domain: 'microsoft.com' } } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { dmp_company_action: 'ADD', ...baseMapping }
      })
    }

    it('throws a non-retryable error when HTTP 200 but elements[0].status is 400', async () => {
      const error = await performWithElement({
        elements: [{ status: 400, error: { message: 'Invalid organization urn' } }]
      }).catch((e) => e)
      expect(error.code).not.toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(400)
    })

    it('throws a retryable error when HTTP 200 but elements[0].status is 429', async () => {
      const error = await performWithElement({ elements: [{ status: 429 }] }).catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(429)
    })

    it('throws a non-retryable error when HTTP 200 but no element result is returned', async () => {
      const error = await performWithElement({ elements: [] }).catch((e) => e)
      expect(error.code).not.toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(400)
    })
    // The happy path (HTTP 200 + elements[0].status 2xx) is covered by the "adds a single company"
    // tests above; they run before any throwing test, avoiding testAction's stale-response leakage.
  })

  describe('performBatch', () => {
    // Full explicit mapping for executeBatch, which (unlike testBatchAction) does not apply useDefaultMappings.
    const batchMapping = {
      dmp_company_action: 'ADD',
      audience_source: 'ENGAGE_RETL',
      computation_key: SOURCE_SEGMENT_ID,
      identifiers: {
        companyDomain: { '@path': '$.traits.company_domain' },
        linkedInCompanyId: { '@path': '$.traits.linkedin_company_id' }
      }
    }

    it('dedupes same-company payloads and fans each result back to every original index', async () => {
      // The 10 valid rows below collapse to 4 unique company+action elements. Case, surrounding
      // whitespace, and bare-id-vs-URN forms of the same company all key the same:
      //   Adobe (idx 0,3,6,11), oracle.com (idx 1,8), org 1476 (idx 4,9), ibm.com (idx 5,10).
      // LinkedIn is sent exactly 4 elements; its per-element result is copied to every original
      // index in that group, and the two no-identifier rows (idx 2,7) fail before the request.
      mockLookup()
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
        dmp_company_action: { '@path': '$.traits.action' },
        audience_source: 'ENGAGE_RETL',
        computation_key: SOURCE_SEGMENT_ID,
        identifiers: {
          companyDomain: { '@path': '$.traits.company_domain' },
          linkedInCompanyId: { '@path': '$.traits.linkedin_company_id' }
        }
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

      // Only 4 unique elements are sent to LinkedIn despite 12 input rows. Domains are normalized
      // (trimmed + lower-cased) before being sent.
      expect(sentBody).toEqual({
        elements: [
          { action: 'ADD', companyWebsiteDomain: 'adobe.com', organizationUrn: 'urn:li:organization:1480' },
          { action: 'ADD', companyWebsiteDomain: 'oracle.com' },
          { action: 'ADD', organizationUrn: 'urn:li:organization:1476' },
          { action: 'ADD', companyWebsiteDomain: 'ibm.com' }
        ]
      })

      // `sent` = the element POSTed to LinkedIn; `body` = LinkedIn's per-element response.
      const adobe = {
        status: 201,
        sent: { action: 'ADD', companyWebsiteDomain: 'adobe.com', organizationUrn: 'urn:li:organization:1480' },
        body: { status: 201 }
      }
      const oracle = {
        status: 201,
        sent: { action: 'ADD', companyWebsiteDomain: 'oracle.com' },
        body: { status: 201 }
      }
      const ibm = {
        status: 201,
        sent: { action: 'ADD', companyWebsiteDomain: 'ibm.com' },
        body: { status: 201 }
      }
      const org1476Error = {
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Invalid organization urn',
        sent: { action: 'ADD', organizationUrn: 'urn:li:organization:1476' },
        body: { status: 400, error: { message: 'Invalid organization urn' } },
        errorreporter: 'DESTINATION'
      }
      // No identifier is a Segment-side validation failure: nothing sent, no response, so
      // `sent`/`body` are omitted and the error is reported by INTEGRATIONS.
      const noIdentifier = () => ({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.",
        errorreporter: 'INTEGRATIONS'
      })

      // Every original index gets a status; duplicate rows carry the representative's sent/body,
      // and the two members of the failed org-1476 group (idx 4, 9) both get the 400 error.
      expect(response).toEqual([
        adobe, // 0
        oracle, // 1
        noIdentifier(), // 2
        adobe, // 3 (dup of 0)
        org1476Error, // 4
        ibm, // 5
        adobe, // 6 (dup of 0)
        noIdentifier(), // 7
        oracle, // 8 (dup of 1, whitespace-normalized)
        org1476Error, // 9 (dup of 4, URN form)
        ibm, // 10 (dup of 5, case-normalized)
        adobe // 11 (dup of 0)
      ])
    })

    it('returns a per-item MultiStatusResponse for a mixed batch', async () => {
      mockLookup()
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

      // sent = the element sent to LinkedIn; body = LinkedIn's per-element response
      expect((response[0] as any).sent).toEqual({ action: 'ADD', companyWebsiteDomain: 'microsoft.com' })
      expect((response[0] as any).body).toEqual({ status: 201 })
      expect((response[1] as any).sent).toEqual({ action: 'ADD', companyWebsiteDomain: 'invalid' })
      expect((response[1] as any).body).toEqual({ status: 400, error: { message: 'Invalid company' } })
    })

    it('marks payloads with no identifier as per-item errors without failing the batch', async () => {
      mockLookup()
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
      mockLookup()
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

    it('fans a non-retryable segment-create failure to every item instead of failing the whole batch', async () => {
      // The batch cannot resolve a segment (create returns a non-retryable 400). Rather than throw
      // and fail the entire batch opaquely, each item is marked as a per-item error.
      mockLookup([])
      nock(BASE_URL).post('/dmpSegments').reply(400, {})

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

      expect(response[0].status).toBe(400)
      expect(response[1].status).toBe(400)
    })

    it('rethrows a retryable segment-resolution failure so the whole batch is retried', async () => {
      // A retryable lookup failure must propagate (not become per-item errors) so the framework
      // retries the entire batch.
      nock(BASE_URL).get('/dmpSegments').query(true).reply(500, {})

      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com' } },
        { type: 'track', traits: { company_domain: 'segment.com' } }
      ] as any

      const error = await testDestination
        .executeBatch('updateCompanyAudience', { events, settings, auth, mapping: batchMapping })
        .catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
    })

    it('fans a whitespace-only Audience Key validation error to every item in batch mode', async () => {
      // No lookup/create is attempted; resolveSourceSegmentId throws before any request.
      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com' } },
        { type: 'track', traits: { company_domain: 'segment.com' } }
      ] as any

      const response = await testDestination.executeBatch('updateCompanyAudience', {
        events,
        settings,
        auth,
        mapping: { ...batchMapping, computation_key: '   ' }
      })

      expect(response[0].status).toBe(400)
      expect(response[1].status).toBe(400)
      expect((response[0] as any).errormessage).toContain('`Audience Key` field is required')
    })
  })
})
