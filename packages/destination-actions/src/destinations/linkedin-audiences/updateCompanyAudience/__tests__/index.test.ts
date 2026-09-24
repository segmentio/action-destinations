import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'
import { MAX_CITY_LENGTH } from '../constants'
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
const mockLookup = (
  elements: Array<{ id: string; name: string; type: string }> = [
    { id: SEGMENT_ID, name: 'My ABM Audience', type: 'COMPANY' }
  ]
) => {
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
    it('does not double-prefix a value that already contains the prefix twice', () => {
      expect(toOrganizationUrn('urn:li:organization:urn:li:organization:1035')).toBe('urn:li:organization:1035')
    })
    it('detects the prefix case-insensitively', () => {
      expect(toOrganizationUrn('URN:LI:ORGANIZATION:1035')).toBe('urn:li:organization:1035')
    })
    it('trims surrounding whitespace', () => {
      expect(toOrganizationUrn('  1035  ')).toBe('urn:li:organization:1035')
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
      ).rejects.toThrow('The `Audience Key` field is required to look up or create a LinkedIn DMP Company Segment.')
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
      ).rejects.toThrow(
        "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field."
      )
    })

    it('treats a LinkedIn Company ID that is only the URN prefix as missing', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { linkedin_company_id: 'urn:li:organization:' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { dmp_company_action: 'ADD', ...baseMapping }
        })
      ).rejects.toThrow(
        "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field."
      )
    })

    it('rejects a dmp_company_action that is not exactly ADD or REMOVE', async () => {
      await expect(
        testDestination.testAction('updateCompanyAudience', {
          event: { type: 'track', traits: { company_domain: 'microsoft.com', action: 'remove' } } as any,
          settings,
          auth,
          useDefaultMappings: true,
          mapping: { ...baseMapping, dmp_company_action: { '@path': '$.traits.action' } }
        })
      ).rejects.toThrow('Company Segment Action must be one of: "ADD" or "REMOVE"')
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

    it('throws a retryable error on 404 (segment just created, not available yet)', async () => {
      const error = await performWithStatus(404).catch((e) => e)
      expect(error.code).toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(429)
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
          "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field.",
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
        { type: 'track', traits: { company_domain: 'not-a-real-company.com' } }
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
      expect((response[1] as any).sent).toEqual({ action: 'ADD', companyWebsiteDomain: 'not-a-real-company.com' })
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
      expect((response[0] as any).errormessage).toBe(
        "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field."
      )
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
      expect((response[1] as any).errormessage).toBe('LinkedIn did not return a result for this company.')
    })

    it('throws when segment resolution fails so the whole batch is retried/failed together', async () => {
      // Segment resolution is batch-scoped (same segment for every item), so a failure fails the
      // whole batch rather than being fanned out as per-item errors.
      mockLookup([])
      nock(BASE_URL).post('/dmpSegments').reply(400, {})

      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com' } },
        { type: 'track', traits: { company_domain: 'segment.com' } }
      ] as any

      const error = await testDestination
        .executeBatch('updateCompanyAudience', { events, settings, auth, mapping: batchMapping })
        .catch((e) => e)
      expect(error.status).toBe(400)
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

    it('marks an invalid dmp_company_action as a per-item error without failing the batch', async () => {
      mockLookup()
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`)
        .reply(200, { elements: [{ status: 201 }] })

      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com', action: 'nope' } },
        { type: 'track', traits: { company_domain: 'segment.com', action: 'ADD' } }
      ] as any

      const response = await testDestination.executeBatch('updateCompanyAudience', {
        events,
        settings,
        auth,
        mapping: { ...batchMapping, dmp_company_action: { '@path': '$.traits.action' } }
      })

      expect(response[0].status).toBe(400)
      expect((response[0] as any).errormessage).toContain('Company Segment Action must be one of')
      expect(response[1].status).toBe(201)
    })

    it('throws on a whitespace-only Audience Key in batch mode', async () => {
      // The Audience Key is a batch key (shared across the batch), so resolveSourceSegmentId throwing
      // is batch-scoped and fails the whole batch before any request.
      const events = [
        { type: 'track', traits: { company_domain: 'microsoft.com' } },
        { type: 'track', traits: { company_domain: 'segment.com' } }
      ] as any

      const error = await testDestination
        .executeBatch('updateCompanyAudience', {
          events,
          settings,
          auth,
          mapping: { ...batchMapping, computation_key: '   ' }
        })
        .catch((e) => e)
      expect(error.message).toBe(
        'The `Audience Key` field is required to look up or create a LinkedIn DMP Company Segment.'
      )
    })
  })

  describe('company fields', () => {
    const companyFieldsBase = {
      audience_source: 'ENGAGE_RETL',
      computation_key: SOURCE_SEGMENT_ID,
      dmp_company_action: 'ADD'
    }

    // Captures the batch body so each test can assert on exactly what LinkedIn was sent. The
    // reply is built from the captured request, so one result comes back per element sent and a
    // mismatch in cardinality cannot pass unnoticed.
    const mockBatch = () => {
      const captured: { body?: any } = {}
      nock(BASE_URL)
        .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
          captured.body = body
          return true
        })
        .reply(200, () => ({
          elements: ((captured.body?.elements ?? []) as unknown[]).map(() => ({ status: 201 }))
        }))
      return captured
    }

    // Sends one event and returns the single element LinkedIn received.
    const sendOne = async (mapping: Record<string, unknown>) => {
      mockLookup()
      const captured = mockBatch()
      await testDestination.testAction('updateCompanyAudience', {
        event: { type: 'track', traits: {} } as any,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { ...companyFieldsBase, ...mapping }
      })
      return captured.body.elements[0]
    }

    describe('identifiers', () => {
      it('sends every identifier when all five are provided', async () => {
        const element = await sendOne({
          identifiers: {
            companyName: 'Microsoft',
            companyDomain: 'microsoft.com',
            companyEmailDomain: 'microsoft.com',
            linkedInCompanyId: '1035',
            companyPageUrl: 'linkedin.com/company/microsoft'
          }
        })

        expect(element).toEqual({
          action: 'ADD',
          companyName: 'Microsoft',
          companyWebsiteDomain: 'microsoft.com',
          companyEmailDomain: 'microsoft.com',
          organizationUrn: 'urn:li:organization:1035',
          companyPageUrl: 'linkedin.com/company/microsoft'
        })
      })

      // A warehouse column may hold either spelling, so both have to reach LinkedIn as the urn.
      it.each(['1035', 'urn:li:organization:1035', 'URN:LI:ORGANIZATION:1035'])(
        'sends the organization urn when the company id is mapped as %s',
        async (linkedInCompanyId: string) => {
          const element = await sendOne({ identifiers: { linkedInCompanyId } })
          expect(element).toEqual({ action: 'ADD', organizationUrn: 'urn:li:organization:1035' })
        }
      )

      it('accepts a company name on its own, with no domain or company id', async () => {
        const element = await sendOne({ identifiers: { companyName: 'Microsoft' } })
        expect(element).toEqual({ action: 'ADD', companyName: 'Microsoft' })
      })

      it('accepts a company page url on its own', async () => {
        const element = await sendOne({ identifiers: { companyPageUrl: 'linkedin.com/company/microsoft' } })
        expect(element).toEqual({ action: 'ADD', companyPageUrl: 'linkedin.com/company/microsoft' })
      })

      it('accepts a company email domain on its own', async () => {
        const element = await sendOne({ identifiers: { companyEmailDomain: 'microsoft.com' } })
        expect(element).toEqual({ action: 'ADD', companyEmailDomain: 'microsoft.com' })
      })

      it('rejects a payload where every identifier is blank', async () => {
        await expect(
          testDestination.testAction('updateCompanyAudience', {
            event: { type: 'track', traits: {} } as any,
            settings,
            auth,
            useDefaultMappings: true,
            mapping: { ...companyFieldsBase, identifiers: { companyName: '  ', companyDomain: '' } }
          })
        ).rejects.toThrow(
          "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field."
        )
      })

      it('reduces companyWebsiteDomain to its host, whatever shape it was mapped in', async () => {
        const element = await sendOne({ identifiers: { companyDomain: '  HTTPS://WWW.Microsoft.com/about  ' } })
        expect(element.companyWebsiteDomain).toBe('www.microsoft.com')
      })
    })

    describe('traits', () => {
      const allTraits = {
        industries: ['Information Technology', 'Software'],
        city: 'Seattle',
        state: 'WA',
        country: 'US',
        postalCode: '98101',
        stockSymbol: 'msft'
      }

      it('sends no traits when the toggle is off, even if they are mapped', async () => {
        const element = await sendOne({
          identifiers: { companyName: 'Microsoft' },
          send_company_traits: false,
          company_traits: allTraits
        })

        expect(element).toEqual({ action: 'ADD', companyName: 'Microsoft' })
      })

      it('sends no traits when the toggle is absent', async () => {
        const element = await sendOne({
          identifiers: { companyName: 'Microsoft' },
          company_traits: allTraits
        })

        expect(element).toEqual({ action: 'ADD', companyName: 'Microsoft' })
      })

      it('sends every trait when the toggle is on', async () => {
        const element = await sendOne({
          identifiers: { companyName: 'Microsoft' },
          send_company_traits: true,
          company_traits: allTraits
        })

        expect(element).toEqual({
          action: 'ADD',
          companyName: 'Microsoft',
          industries: ['Information Technology', 'Software'],
          city: 'Seattle',
          state: 'WA',
          country: 'US',
          postalCode: '98101',
          stockSymbol: 'MSFT'
        })
      })

      // Each case maps a single trait, and asserts on the whole element rather than just that one
      // key: if the other traits showed up in the request as empty values, the test would fail.
      it.each([
        ['city', 'Seattle', 'Seattle'],
        ['state', 'WA', 'WA'],
        ['country', 'us', 'US'],
        ['postalCode', '98101', '98101'],
        ['stockSymbol', 'msft', 'MSFT']
      ])('sends %s on its own', async (key: string, value: string, expected: string) => {
        const element = await sendOne({
          identifiers: { companyName: 'Microsoft' },
          send_company_traits: true,
          company_traits: { [key]: value }
        })
        expect(element).toEqual({ action: 'ADD', companyName: 'Microsoft', [key]: expected })
      })

      describe('industries', () => {
        it('splits a single comma-separated value into separate industries', async () => {
          const element = await sendOne({
            identifiers: { companyName: 'Microsoft' },
            send_company_traits: true,
            company_traits: { industries: 'Software, Information Technology' }
          })
          expect(element.industries).toEqual(['Software', 'Information Technology'])
        })
      })

      describe('country', () => {
        it('accepts a lowercase code, which a choices enum would have rejected outright', async () => {
          // The field is deliberately not a `choices` list: an enum rejects the whole event before
          // the action runs, so a lowercase 'us' would cost the company its audience membership.
          const element = await sendOne({
            identifiers: { companyName: 'Microsoft' },
            send_company_traits: true,
            company_traits: { country: 'de' }
          })
          expect(element.country).toBe('DE')
        })
      })

      it('does not reject the event when a trait breaches a limit', async () => {
        const element = await sendOne({
          identifiers: { companyName: 'Microsoft' },
          send_company_traits: true,
          company_traits: { city: 'a'.repeat(MAX_CITY_LENGTH + 1), country: 'UK' }
        })
        expect(element).toEqual({ action: 'ADD', companyName: 'Microsoft' })
      })
    })

    describe('batch behaviour', () => {
      const batchMapping = {
        ...companyFieldsBase,
        identifiers: { companyName: { '@path': '$.traits.company_name' } },
        enable_batching: true
      }

      it('sends one element per distinct name-only company rather than collapsing them', async () => {
        mockLookup()
        let sentBody: any
        nock(BASE_URL)
          .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
            sentBody = body
            return true
          })
          .reply(200, { elements: [{ status: 201 }, { status: 201 }, { status: 201 }] })

        const events = [
          { type: 'track', traits: { company_name: 'Microsoft' } },
          { type: 'track', traits: { company_name: 'Apple' } },
          { type: 'track', traits: { company_name: 'Google' } }
        ] as any

        const response = await testDestination.executeBatch('updateCompanyAudience', {
          events,
          settings,
          auth,
          mapping: batchMapping
        })

        expect(sentBody.elements).toHaveLength(3)
        expect(sentBody.elements[0].companyName).toBe('Microsoft')
        expect(sentBody.elements[1].companyName).toBe('Apple')
        expect(sentBody.elements[2].companyName).toBe('Google')

        expect(response[0].status).toBe(201)
        expect(response[1].status).toBe(201)
        expect(response[2].status).toBe(201)
      })

      // The case the dedupe exists for: several users in an Engage Audience belong to the same
      // company, so the batch carries the same company several times. Sending it once is the
      // point, but the single result then has to be reported against every event that produced
      // it, or the events that were collapsed away would look like they had never been processed.
      it('collapses users who share a company and fans the result back to each event', async () => {
        mockLookup()
        let sentBody: any
        nock(BASE_URL)
          .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
            sentBody = body
            return true
          })
          // LinkedIn replies with one result because it is sent one company.
          .reply(200, { elements: [{ status: 201 }] })

        // Three separate events, all resolving to the same company.
        const events = [
          { type: 'track', traits: { company_name: 'Microsoft' } },
          { type: 'track', traits: { company_name: 'Microsoft' } },
          { type: 'track', traits: { company_name: 'Microsoft' } }
        ] as any

        const response = await testDestination.executeBatch('updateCompanyAudience', {
          events,
          settings,
          auth,
          mapping: batchMapping
        })

        // All three share a companyKey, so LinkedIn is sent the company once rather than 3 times.
        expect(sentBody.elements).toHaveLength(1)

        // The one result is fanned back out: each original event reports its own 201, so none of
        // them is left without a status.
        expect(response[0].status).toBe(201)
        expect(response[1].status).toBe(201)
        expect(response[2].status).toBe(201)
      })

      // Two users at the same company whose profiles disagree about where it is. Because traits
      // are deliberately left out of the companyKey, the two still collapse into one company, and
      // exactly one profile's traits are sent — the other user's are discarded. This is the
      // behaviour the 'Send Company Traits' toggle warns about, and it is why the toggle exists.
      it('sends one profile’s traits and discards the other when users at a company disagree', async () => {
        mockLookup()
        let sentBody: any
        nock(BASE_URL)
          .post(`/dmpSegments/${SEGMENT_ID}/companies`, (body) => {
            sentBody = body
            return true
          })
          .reply(200, { elements: [{ status: 201 }] })

        // Same company, but every trait disagrees between the two profiles.
        const seattleProfile = { city: 'Seattle', state: 'WA', postalCode: '98101' }
        const austinProfile = { city: 'Austin', state: 'TX', postalCode: '78701' }

        const events = [
          { type: 'track', traits: { company_name: 'Microsoft', city: 'Seattle', state: 'WA', zip: '98101' } },
          { type: 'track', traits: { company_name: 'Microsoft', city: 'Austin', state: 'TX', zip: '78701' } }
        ] as any

        const response = await testDestination.executeBatch('updateCompanyAudience', {
          events,
          settings,
          auth,
          mapping: {
            ...batchMapping,
            send_company_traits: true,
            company_traits: {
              city: { '@path': '$.traits.city' },
              state: { '@path': '$.traits.state' },
              postalCode: { '@path': '$.traits.zip' }
            }
          }
        })

        // One company goes to LinkedIn, not two.
        expect(sentBody.elements).toHaveLength(1)

        const sentTraits = {
          city: sentBody.elements[0].city,
          state: sentBody.elements[0].state,
          postalCode: sentBody.elements[0].postalCode
        }

        // One profile wins outright and its traits travel together. The test accepts either
        // profile because which one wins is not stable — it depends on the order the batch
        // happens to arrive in — but it must be one of them whole. A merged result such as
        // Seattle's city with Texas's state would fail here, and would describe no real place.
        expect([seattleProfile, austinProfile]).toContainEqual(sentTraits)

        // Both events still report their own status, even though one profile's traits were dropped.
        expect(response[0].status).toBe(201)
        expect(response[1].status).toBe(201)
      })
    })
  })
})
