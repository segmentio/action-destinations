import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const conversionTrackingId = '_conversion_id_'
const conversionLabel = '_conversion_'

const DATA_MANAGER_HOST = 'https://datamanager.googleapis.com'
const CUSTOMER_ID = '1234567890'
const REFRESH_TOKEN = 'test-refresh-token'
const ACCESS_TOKEN = 'test-access-token'
const USER_LIST_ID = 'ul_abc123'
const PARTNER_ACCOUNT_ID = '1663649500'

describe('GoogleEnhancedConversions', () => {
  describe('testAuthentication', () => {
    it('should validate loginCustomerId format - valid format', async () => {
      await expect(
        testDestination.testAuthentication({
          conversionTrackingId,
          loginCustomerId: '123-456-7890'
        })
      ).resolves.not.toThrow()
    })

    it('should validate loginCustomerId format - valid format without dashes', async () => {
      await expect(
        testDestination.testAuthentication({
          conversionTrackingId,
          loginCustomerId: '1234567890'
        })
      ).resolves.not.toThrow()
    })

    it('should reject loginCustomerId with invalid format - too few digits', async () => {
      await expect(
        testDestination.testAuthentication({
          conversionTrackingId,
          loginCustomerId: '123-456-789'
        })
      ).rejects.toThrow('Login Customer ID must be 10 digits in XXX-XXX-XXXX format')
    })

    it('should reject loginCustomerId with invalid format - too many digits', async () => {
      await expect(
        testDestination.testAuthentication({
          conversionTrackingId,
          loginCustomerId: '123-456-78901'
        })
      ).rejects.toThrow('Login Customer ID must be 10 digits in XXX-XXX-XXXX format')
    })

    it('should reject loginCustomerId with invalid format - contains letters', async () => {
      await expect(
        testDestination.testAuthentication({
          conversionTrackingId,
          loginCustomerId: '123-456-789A'
        })
      ).rejects.toThrow('Login Customer ID must be 10 digits in XXX-XXX-XXXX format')
    })

    it('should allow empty/undefined loginCustomerId since it is optional', async () => {
      await expect(
        testDestination.testAuthentication({
          conversionTrackingId
        })
      ).resolves.not.toThrow()
    })
  })

  describe('extendRequest - login-customer-id header', () => {
    it('should include login-customer-id header when loginCustomerId is provided', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000'
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId,
          loginCustomerId: '123-456-7890'
        }
      })

      expect((responses[0].options.headers as any)?.get?.('login-customer-id')).toBe('1234567890')
      expect(responses[0].status).toBe(201)
    })

    it('should trim whitespace from loginCustomerId in header', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123'
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId,
          loginCustomerId: '    987-654-3210     '
        }
      })

      expect((responses[0].options.headers as any)?.get?.('login-customer-id')).toBe('9876543210')
      expect((responses[0].options.headers as any)?.has?.('login-customer-id')).toBe(true)
      expect(responses[0].status).toBe(201)
    })

    it('should strip dashes from loginCustomerId in header', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123'
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId,
          loginCustomerId: '987-654-3210'
        }
      })

      expect((responses[0].options.headers as any)?.get?.('login-customer-id')).toBe('9876543210')
      expect(responses[0].status).toBe(201)
    })

    it('should not include login-customer-id header when loginCustomerId is not provided', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123'
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId
        }
      })

      const headers = responses[0].options.headers as any
      expect(headers?.get?.('login-customer-id')).toBeNull()
      expect(headers?.has?.('login-customer-id')).toBe(false)
      expect(responses[0].status).toBe(201)
    })

    it('should not include login-customer-id header when loginCustomerId is an empty string', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123'
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId,
          loginCustomerId: ''
        }
      })

      const headers = responses[0].options.headers as any
      expect(headers?.get?.('login-customer-id')).toBeNull()
      expect(headers?.has?.('login-customer-id')).toBe(false)
      expect(responses[0].status).toBe(201)
    })
  })

  describe('postConversion', () => {
    it('should should send an event with default mappings', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000',
          address: {
            street: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94000',
            country: 'USA'
          }
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"pii_data\\":{\\"hashed_email\\":\\"1hFzBkhe0OUK-rOshx6Y-BaZFR8wKBUn1j_18jNlbGk=\\",\\"hashed_phone_number\\":[\\"5pAiami9y4LWCmP12H9fXJpoqrnOFRL7u9q1pkqlMmI=\\"],\\"address\\":[{\\"hashed_first_name\\":\\"IGT0sXMskUo9vWuqGeOhA-RylOG2Oj_IcIX2Zr5f7GU=\\",\\"hashed_last_name\\":\\"ZieDX5iOLF5QUz1JEWMHLT9PQfXIsEYwFQ3rs3Isot0=\\",\\"hashed_street_address\\":\\"tHP71r8-GY59XKpmdb6ssI3fd7TIBB6E6aCWN06RGBw=\\",\\"city\\":\\"sanfrancisco\\",\\"region\\":\\"ca\\",\\"postcode\\":\\"94000\\",\\"country\\":\\"USA\\"}]},\\"oid\\":\\"123\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"conversion_time\\":1623348484000000,\\"label\\":\\"_conversion_\\"}"`
      )

      expect(responses[0].options.searchParams).toMatchInlineSnapshot(`
        Object {
          "conversion_tracking_id": "_conversion_id_",
        }
      `)

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should accept an event without context.userAgent', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000',
          address: {
            street: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94000',
            country: 'USA'
          }
        }
      })
      if (event?.context?.userAgent) {
        delete event.context.userAgent
      }

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"pii_data\\":{\\"hashed_email\\":\\"1hFzBkhe0OUK-rOshx6Y-BaZFR8wKBUn1j_18jNlbGk=\\",\\"hashed_phone_number\\":[\\"5pAiami9y4LWCmP12H9fXJpoqrnOFRL7u9q1pkqlMmI=\\"],\\"address\\":[{\\"hashed_first_name\\":\\"IGT0sXMskUo9vWuqGeOhA-RylOG2Oj_IcIX2Zr5f7GU=\\",\\"hashed_last_name\\":\\"ZieDX5iOLF5QUz1JEWMHLT9PQfXIsEYwFQ3rs3Isot0=\\",\\"hashed_street_address\\":\\"tHP71r8-GY59XKpmdb6ssI3fd7TIBB6E6aCWN06RGBw=\\",\\"city\\":\\"sanfrancisco\\",\\"region\\":\\"ca\\",\\"postcode\\":\\"94000\\",\\"country\\":\\"USA\\"}]},\\"oid\\":\\"123\\",\\"conversion_time\\":1623348484000000,\\"label\\":\\"_conversion_\\"}"`
      )

      expect(responses[0].options.searchParams).toMatchInlineSnapshot(`
        Object {
          "conversion_tracking_id": "_conversion_id_",
        }
      `)

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })
    it('should send pcc_game:1 when PCC Game is set to true', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000',
          address: {
            street: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94000',
            country: 'USA'
          }
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: {
          conversion_label: conversionLabel,
          pcc_game: true
        },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"pii_data\\":{\\"hashed_email\\":\\"1hFzBkhe0OUK-rOshx6Y-BaZFR8wKBUn1j_18jNlbGk=\\",\\"hashed_phone_number\\":[\\"5pAiami9y4LWCmP12H9fXJpoqrnOFRL7u9q1pkqlMmI=\\"],\\"address\\":[{\\"hashed_first_name\\":\\"IGT0sXMskUo9vWuqGeOhA-RylOG2Oj_IcIX2Zr5f7GU=\\",\\"hashed_last_name\\":\\"ZieDX5iOLF5QUz1JEWMHLT9PQfXIsEYwFQ3rs3Isot0=\\",\\"hashed_street_address\\":\\"tHP71r8-GY59XKpmdb6ssI3fd7TIBB6E6aCWN06RGBw=\\",\\"city\\":\\"sanfrancisco\\",\\"region\\":\\"ca\\",\\"postcode\\":\\"94000\\",\\"country\\":\\"USA\\"}]},\\"oid\\":\\"123\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"conversion_time\\":1623348484000000,\\"label\\":\\"_conversion_\\",\\"pcc_game\\":1}"`
      )

      expect(responses[0].options.searchParams).toMatchInlineSnapshot(`
        Object {
          "conversion_tracking_id": "_conversion_id_",
        }
      `)

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })
    it('should send is_app_incrementality:1 when App conversion for Incrementality Study is set to true', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000',
          address: {
            street: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94000',
            country: 'USA'
          }
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: {
          conversion_label: conversionLabel,
          is_app_incrementality: true
        },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"pii_data\\":{\\"hashed_email\\":\\"1hFzBkhe0OUK-rOshx6Y-BaZFR8wKBUn1j_18jNlbGk=\\",\\"hashed_phone_number\\":[\\"5pAiami9y4LWCmP12H9fXJpoqrnOFRL7u9q1pkqlMmI=\\"],\\"address\\":[{\\"hashed_first_name\\":\\"IGT0sXMskUo9vWuqGeOhA-RylOG2Oj_IcIX2Zr5f7GU=\\",\\"hashed_last_name\\":\\"ZieDX5iOLF5QUz1JEWMHLT9PQfXIsEYwFQ3rs3Isot0=\\",\\"hashed_street_address\\":\\"tHP71r8-GY59XKpmdb6ssI3fd7TIBB6E6aCWN06RGBw=\\",\\"city\\":\\"sanfrancisco\\",\\"region\\":\\"ca\\",\\"postcode\\":\\"94000\\",\\"country\\":\\"USA\\"}]},\\"oid\\":\\"123\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"conversion_time\\":1623348484000000,\\"label\\":\\"_conversion_\\",\\"is_app_incrementality\\":1}"`
      )

      expect(responses[0].options.searchParams).toMatchInlineSnapshot(`
        Object {
          "conversion_tracking_id": "_conversion_id_",
        }
      `)

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should rethrow the original error if error object does not contain error_statuses key', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000',
          address: {
            street: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94000',
            country: 'USA'
          }
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(400, {})

      await expect(
        testDestination.testAction('postConversion', {
          event,
          mapping: { conversion_label: conversionLabel },
          useDefaultMappings: true,
          settings: {
            conversionTrackingId
          }
        })
      ).rejects.toHaveProperty('response.status', 400)
    })
  })
})

// ─── STRATCONN-6707: createAudience / getAudience OAuth flow ─────────────────

describe('GoogleEnhancedConversions — createAudience (STRATCONN-6707)', () => {
  const savedClientId = process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID
  const savedClientSecret = process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET

  beforeEach(() => {
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID = 'client-id'
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET = 'client-secret'
    nock.cleanAll()
  })

  afterEach(() => {
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID = savedClientId
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET = savedClientSecret
    nock.cleanAll()
  })

  const baseInput = {
    audienceName: 'Test Audience',
    audienceSettings: { supports_conversions: false, external_id_type: 'CONTACT_INFO' },
    settings: { customerId: CUSTOMER_ID, oauth: { refresh_token: REFRESH_TOKEN } }
  }

  it('returns { externalId: "segment" } immediately when supports_conversions is true', async () => {
    const result = await testDestination.createAudience({
      ...baseInput,
      audienceSettings: { supports_conversions: true }
    })
    expect(result).toEqual({ externalId: 'segment' })
  })

  it('throws MISSING_OAUTH_TOKEN when oauth refresh_token is absent', async () => {
    await expect(
      testDestination.createAudience({
        ...baseInput,
        settings: { customerId: CUSTOMER_ID, oauth: {} }
      })
    ).rejects.toMatchObject({ code: 'MISSING_OAUTH_TOKEN' })
  })

  it('full happy path: exchanges token → creates partner link → creates user list → returns externalId', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks`)
      .reply(200, {
        name: `accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks/link1`,
        partnerLinkId: 'link1',
        owningAccount: { accountId: CUSTOMER_ID, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: PARTNER_ACCOUNT_ID, accountType: 'DATA_PARTNER' }
      })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists`)
      .reply(200, { name: 'some/name', id: USER_LIST_ID, displayName: 'Test Audience' })

    const result = await testDestination.createAudience(baseInput)
    expect(result).toMatchObject({ externalId: USER_LIST_ID, refresh_token: REFRESH_TOKEN })
  })

  it('uses loginCustomerId (dashes stripped) as owning account in partner link', async () => {
    const strippedLoginId = '9876543210'
    let capturedPartnerLinkBody: any

    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks`, (body) => {
        capturedPartnerLinkBody = body
        return true
      })
      .reply(200, {
        name: `accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks/link1`,
        partnerLinkId: 'link1',
        owningAccount: { accountId: strippedLoginId, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: PARTNER_ACCOUNT_ID, accountType: 'DATA_PARTNER' }
      })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists`)
      .reply(200, { name: 'some/name', id: USER_LIST_ID, displayName: 'Test Audience' })

    await testDestination.createAudience({
      ...baseInput,
      settings: { customerId: CUSTOMER_ID, loginCustomerId: '987-654-3210', oauth: { refresh_token: REFRESH_TOKEN } }
    })

    expect(capturedPartnerLinkBody?.owningAccount?.accountId).toBe(strippedLoginId)
  })

  it('normalises customerId by stripping dashes before calling Data Manager', async () => {
    const customerIdWithDashes = '123-456-7890'
    const customerIdStripped = '1234567890'

    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${customerIdStripped}/partnerLinks`)
      .reply(200, {
        name: `accountTypes/GOOGLE_ADS/accounts/${customerIdStripped}/partnerLinks/link1`,
        partnerLinkId: 'link1',
        owningAccount: { accountId: customerIdStripped, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: PARTNER_ACCOUNT_ID, accountType: 'DATA_PARTNER' }
      })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${customerIdStripped}/userLists`)
      .reply(200, { name: 'some/name', id: USER_LIST_ID, displayName: 'Test Audience' })

    const result = await testDestination.createAudience({
      ...baseInput,
      settings: { customerId: customerIdWithDashes, oauth: { refresh_token: REFRESH_TOKEN } }
    })

    expect(result).toMatchObject({ externalId: USER_LIST_ID })
  })

  it('wraps partner link errors as CREATE_AUDIENCE_FAILED', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks`)
      .reply(403, { error: { message: 'Permission denied' } })

    await expect(testDestination.createAudience(baseInput)).rejects.toMatchObject({ code: 'CREATE_AUDIENCE_FAILED' })
  })

  it('wraps user list creation errors as CREATE_AUDIENCE_FAILED', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks`)
      .reply(200, {
        name: `accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks/link1`,
        partnerLinkId: 'link1',
        owningAccount: { accountId: CUSTOMER_ID, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: PARTNER_ACCOUNT_ID, accountType: 'DATA_PARTNER' }
      })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists`)
      .reply(500, { error: { message: 'Internal error' } })

    await expect(testDestination.createAudience(baseInput)).rejects.toMatchObject({ code: 'CREATE_AUDIENCE_FAILED' })
  })

  it('throws CREATE_AUDIENCE_FAILED when user list response has no id', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks`)
      .reply(200, {
        name: `accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/partnerLinks/link1`,
        partnerLinkId: 'link1',
        owningAccount: { accountId: CUSTOMER_ID, accountType: 'GOOGLE_ADS' },
        partnerAccount: { accountId: PARTNER_ACCOUNT_ID, accountType: 'DATA_PARTNER' }
      })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists`)
      .reply(200, { name: 'some/name', displayName: 'Test' }) // no `id`

    await expect(testDestination.createAudience(baseInput)).rejects.toMatchObject({ code: 'CREATE_AUDIENCE_FAILED' })
  })
})

describe('GoogleEnhancedConversions — getAudience (STRATCONN-6707)', () => {
  const savedClientId = process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID
  const savedClientSecret = process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET

  beforeEach(() => {
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID = 'client-id'
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET = 'client-secret'
    nock.cleanAll()
  })

  afterEach(() => {
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID = savedClientId
    process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET = savedClientSecret
    nock.cleanAll()
  })

  it('returns legacy externalId unchanged when it equals "segment"', async () => {
    const result = await testDestination.getAudience({
      externalId: 'segment',
      settings: { customerId: CUSTOMER_ID, oauth: { refresh_token: REFRESH_TOKEN } }
    })
    expect(result).toEqual({ externalId: 'segment' })
  })

  it('full happy path: exchanges token → GETs user list from Data Manager → returns externalId', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .get(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists/${USER_LIST_ID}`)
      .reply(200, {
        name: `accounts/${CUSTOMER_ID}/userLists/${USER_LIST_ID}`,
        id: USER_LIST_ID,
        displayName: 'Test Audience'
      })

    const result = await testDestination.getAudience({
      externalId: USER_LIST_ID,
      settings: { customerId: CUSTOMER_ID, oauth: { refresh_token: REFRESH_TOKEN } }
    })

    expect(result).toEqual({ externalId: USER_LIST_ID })
  })

  it('throws INVALID_RESPONSE when Data Manager returns a user list with no id', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .get(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists/${USER_LIST_ID}`)
      .reply(200, { name: 'some/name', displayName: 'Test' }) // no `id`

    await expect(
      testDestination.getAudience({
        externalId: USER_LIST_ID,
        settings: { customerId: CUSTOMER_ID, oauth: { refresh_token: REFRESH_TOKEN } }
      })
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('propagates HTTP errors from the Data Manager GET endpoint', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .get(`/v1/accountTypes/GOOGLE_ADS/accounts/${CUSTOMER_ID}/userLists/${USER_LIST_ID}`)
      .reply(404, { error: { message: 'Not found' } })

    await expect(
      testDestination.getAudience({
        externalId: USER_LIST_ID,
        settings: { customerId: CUSTOMER_ID, oauth: { refresh_token: REFRESH_TOKEN } }
      })
    ).rejects.toBeDefined()
  })
})
