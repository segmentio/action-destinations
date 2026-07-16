import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { SegmentEvent } from '@segment/actions-core'

const DATA_MANAGER_HOST = 'https://datamanager.googleapis.com'
const HOOK_CUSTOMER_ID = '1234567890'
const HOOK_REFRESH_TOKEN = 'hook-refresh-token'
const HOOK_ACCESS_TOKEN = 'hook-access-token'
const HOOK_USER_LIST_ID = 'ul_hook123'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()

// ─── STRATCONN-6707: userList performHook (retlOnMappingSave) OAuth changes ───

describe('GoogleEnhancedConversions — userList performHook (STRATCONN-6707)', () => {
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

  const hookSettings = { customerId: HOOK_CUSTOMER_ID, oauth: { refresh_token: HOOK_REFRESH_TOKEN } }

  it('returns TOKEN_EXCHANGE_FAILURE error when token exchange fails', async () => {
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(401, { error: 'invalid_grant' })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_name: 'New List', external_id_type: 'CONTACT_INFO' },
      payload: {}
    })

    expect(result).toMatchObject({ error: { code: 'TOKEN_EXCHANGE_FAILURE' } })
  })

  it('uses an existing list when list_id is provided and the list exists', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .get(`/v1/accountTypes/GOOGLE_ADS/accounts/${HOOK_CUSTOMER_ID}/userLists/${HOOK_USER_LIST_ID}`)
      .reply(200, {
        name: `accounts/${HOOK_CUSTOMER_ID}/userLists/${HOOK_USER_LIST_ID}`,
        id: HOOK_USER_LIST_ID,
        displayName: 'My Existing List'
      })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_id: HOOK_USER_LIST_ID, list_name: 'My Existing List', external_id_type: 'CONTACT_INFO' },
      payload: {}
    })

    expect(result).toMatchObject({
      successMessage: expect.stringContaining(HOOK_USER_LIST_ID),
      savedData: { id: HOOK_USER_LIST_ID, name: 'My Existing List', external_id_type: 'CONTACT_INFO' }
    })
  })

  it('returns GET_LIST_FAILURE error when an existing list cannot be fetched', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .get(`/v1/accountTypes/GOOGLE_ADS/accounts/${HOOK_CUSTOMER_ID}/userLists/${HOOK_USER_LIST_ID}`)
      .reply(404, { error: { message: 'User list not found' } })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_id: HOOK_USER_LIST_ID, list_name: 'My List', external_id_type: 'CONTACT_INFO' },
      payload: {}
    })

    expect(result).toMatchObject({ error: { code: expect.stringMatching(/GET_LIST_FAILURE|INVALID_RESPONSE/) } })
  })

  it('creates a new list when no list_id is provided', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${HOOK_CUSTOMER_ID}/userLists`)
      .reply(200, {
        name: `accounts/${HOOK_CUSTOMER_ID}/userLists/${HOOK_USER_LIST_ID}`,
        id: HOOK_USER_LIST_ID,
        displayName: 'Brand New List'
      })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_name: 'Brand New List', external_id_type: 'CONTACT_INFO' },
      payload: {}
    })

    expect(result).toMatchObject({
      successMessage: expect.stringContaining(HOOK_USER_LIST_ID),
      savedData: { id: HOOK_USER_LIST_ID, name: 'Brand New List' }
    })
  })

  it('returns CREATE_LIST_FAILURE error when list creation fails', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${HOOK_CUSTOMER_ID}/userLists`)
      .reply(400, { error: { message: 'Invalid request' } })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_name: 'Bad List', external_id_type: 'CONTACT_INFO' },
      payload: {}
    })

    expect(result).toMatchObject({
      error: { code: expect.stringMatching(/CREATE_LIST_FAILURE|CREATE_AUDIENCE_FAILED/) }
    })
  })

  it('returns PayloadValidationError wrapped in error when MOBILE_ADVERTISING_ID is used without app_id', async () => {
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    const result = await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_name: 'Mobile List', external_id_type: 'MOBILE_ADVERTISING_ID' }, // no app_id
      payload: {}
    })

    expect(result).toMatchObject({ error: { message: expect.stringContaining('App ID') } })
  })

  it('maps CONTACT_INFO → CONTACT_ID in the Data Manager request', async () => {
    let capturedBody: any

    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${HOOK_CUSTOMER_ID}/userLists`, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, {
        name: `accounts/${HOOK_CUSTOMER_ID}/userLists/${HOOK_USER_LIST_ID}`,
        id: HOOK_USER_LIST_ID,
        displayName: 'Contact List'
      })

    await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_name: 'Contact List', external_id_type: 'CONTACT_INFO' },
      payload: {}
    })

    expect(capturedBody?.uploadKeyType).toBe('CONTACT_ID')
  })

  it('maps CRM_ID → USER_ID in the Data Manager request', async () => {
    let capturedBody: any

    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .reply(200, { access_token: HOOK_ACCESS_TOKEN, expires_in: 3600, token_type: 'Bearer' })

    nock(DATA_MANAGER_HOST)
      .post(`/v1/accountTypes/GOOGLE_ADS/accounts/${HOOK_CUSTOMER_ID}/userLists`, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, {
        name: `accounts/${HOOK_CUSTOMER_ID}/userLists/${HOOK_USER_LIST_ID}`,
        id: HOOK_USER_LIST_ID,
        displayName: 'CRM List'
      })

    await testDestination.actions.userList.executeHook('retlOnMappingSave', {
      auth: { refreshToken: HOOK_REFRESH_TOKEN, accessToken: '' },
      settings: hookSettings,
      hookInputs: { list_name: 'CRM List', external_id_type: 'CRM_ID' },
      payload: {}
    })

    expect(capturedBody?.uploadKeyType).toBe('USER_ID')
  })
})

// ─── STRATCONN-6707: handleDataManagerUpdate (perform / performBatch) ──────────

describe('GoogleEnhancedConversions — handleDataManagerUpdate', () => {
  const DM_HOST = 'https://datamanager.googleapis.com'
  const DM_INGEST_PATH = '/v1/audienceMembers:ingest'
  const DM_REMOVE_PATH = '/v1/audienceMembers:remove'
  const PARTNER_ACCOUNT_ID = '262932431'
  const cid = '9876543210'
  const listId = 'ul_test_list'

  const baseMapping = {
    ad_user_data_consent_state: 'GRANTED',
    ad_personalization_consent_state: 'DENIED',
    external_audience_id: listId,
    retlOnMappingSave: {
      outputs: { id: listId, name: 'Test List', external_id_type: 'CONTACT_INFO' }
    }
  }

  // executeBatch requires explicit path mappings (no useDefaultMappings support)
  const batchMapping = {
    email: { '@path': '$.properties.email' },
    phone: { '@path': '$.properties.phone' },
    first_name: { '@path': '$.properties.firstName' },
    last_name: { '@path': '$.properties.lastName' },
    event_name: { '@path': '$.event' },
    ad_user_data_consent_state: 'GRANTED',
    ad_personalization_consent_state: 'DENIED',
    external_audience_id: listId,
    retlOnMappingSave: {
      outputs: { id: listId, name: 'Test List', external_id_type: 'CONTACT_INFO' }
    }
  }

  beforeEach(() => {
    nock.cleanAll()
    testDestination.responses = []
  })
  afterEach(() => nock.cleanAll())

  // ── perform (single event) ─────────────────────────────────────────────────

  it('perform: Audience Entered routes to audienceMembers:ingest with correct destination structure', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-1' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    const responses = await testDestination.testAction('userList', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(responses.length).toBe(1)
    expect(capturedBody.destinations).toHaveLength(1)
    const dest = capturedBody.destinations[0]
    expect(dest.loginAccount).toEqual({ accountId: PARTNER_ACCOUNT_ID, accountType: 'DATA_PARTNER' })
    expect(dest.linkedAccount).toEqual({ accountId: cid, accountType: 'GOOGLE_ADS' })
    expect(dest.operatingAccount).toEqual({ accountId: cid, accountType: 'GOOGLE_ADS' })
    expect(dest.productDestinationId).toBe(listId)
    expect(capturedBody.encoding).toBe('HEX')
    expect(capturedBody.termsOfService?.customerMatchTermsOfServiceStatus).toBe('ACCEPTED')
  })

  it('perform: Audience Exited routes to audienceMembers:remove', async () => {
    nock(DM_HOST).post(DM_REMOVE_PATH).reply(200, { requestId: 'req-2' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Exited',
      properties: { email: 'test@gmail.com' }
    })

    const responses = await testDestination.testAction('userList', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].url).toContain('audienceMembers:remove')
  })

  it('perform: syncMode=add always routes to ingest', async () => {
    nock(DM_HOST).post(DM_INGEST_PATH).reply(200, { requestId: 'req-3' })

    const event = createTestEvent({ timestamp, event: 'Some Other Event', properties: { email: 'test@gmail.com' } })

    const responses = await testDestination.testAction('userList', {
      event,
      mapping: { ...baseMapping, __segment_internal_sync_mode: 'add' },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].url).toContain('audienceMembers:ingest')
  })

  it('perform: syncMode=delete always routes to remove', async () => {
    nock(DM_HOST).post(DM_REMOVE_PATH).reply(200, { requestId: 'req-4' })

    const event = createTestEvent({ timestamp, event: 'Some Other Event', properties: { email: 'test@gmail.com' } })

    const responses = await testDestination.testAction('userList', {
      event,
      mapping: { ...baseMapping, __segment_internal_sync_mode: 'delete' },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].url).toContain('audienceMembers:remove')
  })

  it('perform: syncMode=mirror + event=new routes to ingest', async () => {
    nock(DM_HOST).post(DM_INGEST_PATH).reply(200, { requestId: 'req-5' })

    const event = createTestEvent({ timestamp, event: 'new', properties: { email: 'test@gmail.com' } })

    await testDestination.testAction('userList', {
      event,
      mapping: { ...baseMapping, __segment_internal_sync_mode: 'mirror' },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(nock.isDone()).toBe(true)
  })

  it('perform: syncMode=mirror + event=updated routes to ingest', async () => {
    nock(DM_HOST).post(DM_INGEST_PATH).reply(200, { requestId: 'req-6' })

    const event = createTestEvent({ timestamp, event: 'updated', properties: { email: 'test@gmail.com' } })

    await testDestination.testAction('userList', {
      event,
      mapping: { ...baseMapping, __segment_internal_sync_mode: 'mirror' },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(nock.isDone()).toBe(true)
  })

  it('perform: syncMode=mirror + event=deleted routes to remove', async () => {
    nock(DM_HOST).post(DM_REMOVE_PATH).reply(200, { requestId: 'req-7' })

    const event = createTestEvent({ timestamp, event: 'deleted', properties: { email: 'test@gmail.com' } })

    await testDestination.testAction('userList', {
      event,
      mapping: { ...baseMapping, __segment_internal_sync_mode: 'mirror' },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(nock.isDone()).toBe(true)
  })

  it('perform: throws PayloadValidationError when no external audience ID is resolvable', async () => {
    const event = createTestEvent({ timestamp, event: 'Audience Entered', properties: { email: 'test@gmail.com' } })

    await expect(
      testDestination.testAction('userList', {
        event,
        mapping: {
          ad_user_data_consent_state: 'GRANTED',
          ad_personalization_consent_state: 'GRANTED',
          // no external_audience_id, no retlOnMappingSave outputs
          retlOnMappingSave: { outputs: { id: '', name: '', external_id_type: 'CONTACT_INFO' } }
        },
        useDefaultMappings: true,
        settings: { customerId: cid }
      })
    ).rejects.toThrow('External Audience ID is required.')
  })

  // ── Consent mapping ────────────────────────────────────────────────────────

  it('perform: maps GRANTED consent to CONSENT_GRANTED in audienceMembers payload', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-c1' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        ad_user_data_consent_state: 'GRANTED',
        ad_personalization_consent_state: 'GRANTED'
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(capturedBody.audienceMembers[0].consent).toEqual({
      adUserData: 'CONSENT_GRANTED',
      adPersonalization: 'CONSENT_GRANTED'
    })
  })

  it('perform: maps DENIED consent to CONSENT_DENIED in audienceMembers payload', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-c2' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        ad_user_data_consent_state: 'DENIED',
        ad_personalization_consent_state: 'DENIED'
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(capturedBody.audienceMembers[0].consent).toEqual({
      adUserData: 'CONSENT_DENIED',
      adPersonalization: 'CONSENT_DENIED'
    })
  })

  it('perform: UNSPECIFIED consent maps to undefined (key absent) in audienceMembers payload', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-c3' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        ad_user_data_consent_state: 'UNSPECIFIED',
        ad_personalization_consent_state: 'UNSPECIFIED'
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(capturedBody.audienceMembers[0].consent.adUserData).toBeUndefined()
    expect(capturedBody.audienceMembers[0].consent.adPersonalization).toBeUndefined()
  })

  // ── buildAudienceMember: CONTACT_INFO ─────────────────────────────────────

  it('perform: CONTACT_INFO builds userData with hashed email, phone, and address', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-ci1' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: {
        email: 'test@gmail.com',
        phone: '3234567890',
        firstName: 'Jane',
        lastName: 'Doe',
        address: { postalCode: '12345' }
      }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        country_code: 'US',
        postal_code: '12345'
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    const member = capturedBody.audienceMembers[0]
    expect(member.userData).toBeDefined()
    const identifiers = member.userData.userIdentifiers
    expect(identifiers.some((id: any) => id.emailAddress)).toBe(true)
    expect(identifiers.some((id: any) => id.phoneNumber)).toBe(true)
    expect(identifiers.some((id: any) => id.address)).toBe(true)
    expect(member.mobileData).toBeUndefined()
    expect(member.userIdData).toBeUndefined()
  })

  it('perform: CONTACT_INFO with only email produces a single emailAddress identifier', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-ci2' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    const identifiers = capturedBody.audienceMembers[0].userData.userIdentifiers
    expect(identifiers).toHaveLength(1)
    // sha256 of 'test@gmail.com'
    expect(identifiers[0].emailAddress).toBe('87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674')
  })

  // ── buildAudienceMember: CRM_ID ────────────────────────────────────────────

  it('perform: CRM_ID builds userIdData instead of userData', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-crm1' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        crm_id: 'user-abc-123',
        retlOnMappingSave: {
          outputs: { id: listId, name: 'CRM List', external_id_type: 'CRM_ID' }
        }
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    const member = capturedBody.audienceMembers[0]
    expect(member.userIdData).toEqual({ userId: 'user-abc-123' })
    expect(member.userData).toBeUndefined()
    expect(member.mobileData).toBeUndefined()
  })

  it('perform: CRM_ID with empty crm_id produces no audienceMembers (member skipped)', async () => {
    // No DM nock registered — if a request is made the test will fail due to nock throwing
    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    const responses = await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        crm_id: '   ', // whitespace-only is treated as empty after trim
        retlOnMappingSave: {
          outputs: { id: listId, name: 'CRM List', external_id_type: 'CRM_ID' }
        }
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    // No HTTP calls since member was null — empty results
    expect(responses).toHaveLength(0)
  })

  // ── buildAudienceMember: MOBILE_ADVERTISING_ID ────────────────────────────

  it('perform: MOBILE_ADVERTISING_ID builds mobileData with mobileIds', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-mob1' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      context: { device: { advertisingId: 'AABBCCDD-1122-3344-5566-AABBCCDD0011' } },
      properties: {}
    })

    await testDestination.testAction('userList', {
      event,
      mapping: {
        ...baseMapping,
        retlOnMappingSave: {
          outputs: { id: listId, name: 'Mobile List', external_id_type: 'MOBILE_ADVERTISING_ID' }
        }
      },
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    const member = capturedBody.audienceMembers[0]
    expect(member.mobileData).toEqual({ mobileIds: ['AABBCCDD-1122-3344-5566-AABBCCDD0011'] })
    expect(member.userData).toBeUndefined()
    expect(member.userIdData).toBeUndefined()
  })

  // ── MCC / loginCustomerId destination structure ────────────────────────────

  it('perform: loginCustomerId is used as linkedAccount for MCC setups', async () => {
    let capturedBody: any
    const loginCid = '1111222233'

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-mcc1' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings: { customerId: cid, loginCustomerId: loginCid }
    })

    const dest = capturedBody.destinations[0]
    expect(dest.linkedAccount).toEqual({ accountId: loginCid, accountType: 'GOOGLE_ADS' })
    expect(dest.operatingAccount).toEqual({ accountId: cid, accountType: 'GOOGLE_ADS' })
  })

  it('perform: loginCustomerId with dashes is normalised (dashes stripped)', async () => {
    let capturedBody: any
    const loginCidWithDashes = '111-122-2233'
    const loginCidNormalised = '1111222233'

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-mcc2' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings: { customerId: cid, loginCustomerId: loginCidWithDashes }
    })

    expect(capturedBody.destinations[0].linkedAccount.accountId).toBe(loginCidNormalised)
  })

  it('perform: without loginCustomerId, linkedAccount falls back to customerId', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'req-mcc3' })

    const event = createTestEvent({
      timestamp,
      event: 'Audience Entered',
      properties: { email: 'test@gmail.com' }
    })

    await testDestination.testAction('userList', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings: { customerId: cid }
    })

    expect(capturedBody.destinations[0].linkedAccount.accountId).toBe(cid)
  })

  // ── performBatch ───────────────────────────────────────────────────────────

  it('performBatch: mixed Audience Entered / Exited events split into ingest + remove calls', async () => {
    nock(DM_HOST).post(DM_INGEST_PATH).reply(200, { requestId: 'batch-ingest-1' })
    nock(DM_HOST).post(DM_REMOVE_PATH).reply(200, { requestId: 'batch-remove-1' })

    const events: SegmentEvent[] = [
      createTestEvent({ timestamp, event: 'Audience Entered', properties: { email: 'enter@example.com' } }),
      createTestEvent({ timestamp, event: 'Audience Exited', properties: { email: 'exit@example.com' } })
    ]

    const responses = await testDestination.executeBatch('userList', {
      events,
      mapping: batchMapping,
      settings: { customerId: cid }
    })

    // Both events succeed; one ingest call + one remove call = 2 responses
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('performBatch: all Audience Entered events produce a single ingest call', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'batch-ingest-2' })

    const events: SegmentEvent[] = [
      createTestEvent({ timestamp, event: 'Audience Entered', properties: { email: 'a@example.com' } }),
      createTestEvent({ timestamp, event: 'Audience Entered', properties: { email: 'b@example.com' } })
    ]

    await testDestination.executeBatch('userList', {
      events,
      mapping: batchMapping,
      settings: { customerId: cid }
    })

    expect(capturedBody.audienceMembers).toHaveLength(2)
  })

  it('performBatch: all Audience Exited events produce a single remove call', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_REMOVE_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'batch-remove-2' })

    const events: SegmentEvent[] = [
      createTestEvent({ timestamp, event: 'Audience Exited', properties: { email: 'a@example.com' } }),
      createTestEvent({ timestamp, event: 'Audience Exited', properties: { email: 'b@example.com' } })
    ]

    await testDestination.executeBatch('userList', {
      events,
      mapping: batchMapping,
      settings: { customerId: cid }
    })

    expect(capturedBody.audienceMembers).toHaveLength(2)
  })

  it('performBatch: events with no resolvable member identifiers are silently skipped', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'batch-skip-1' })

    const events: SegmentEvent[] = [
      // valid
      createTestEvent({ timestamp, event: 'Audience Entered', properties: { email: 'good@example.com' } }),
      // no identifiable fields for CONTACT_INFO
      createTestEvent({ timestamp, event: 'Audience Entered', properties: { gclid: '54321' } })
    ]

    await testDestination.executeBatch('userList', {
      events,
      mapping: batchMapping,
      settings: { customerId: cid }
    })

    // Only the valid member is sent
    expect(capturedBody.audienceMembers).toHaveLength(1)
  })

  it('performBatch: Engage audience membership (true/false) controls add vs remove per event', async () => {
    let ingestBody: any
    let removeBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        ingestBody = body
        return true
      })
      .reply(200, { requestId: 'am-ingest' })

    nock(DM_HOST)
      .post(DM_REMOVE_PATH, (body) => {
        removeBody = body
        return true
      })
      .reply(200, { requestId: 'am-remove' })

    // Engage format: computation_class=audience, computation_key=test_audience,
    // membership resolved from properties[computation_key]
    const events: SegmentEvent[] = [
      createTestEvent({
        timestamp,
        type: 'track',
        event: 'Test Event',
        context: { personas: { computation_class: 'audience', computation_key: 'test_audience' } },
        properties: { email: 'add@example.com', test_audience: true }
      }),
      createTestEvent({
        timestamp,
        type: 'track',
        event: 'Test Event',
        context: { personas: { computation_class: 'audience', computation_key: 'test_audience' } },
        properties: { email: 'remove@example.com', test_audience: false }
      })
    ]

    await testDestination.executeBatch('userList', {
      events,
      mapping: batchMapping,
      settings: { customerId: cid }
    })

    expect(ingestBody.audienceMembers).toHaveLength(1)
    expect(removeBody.audienceMembers).toHaveLength(1)
  })

  it('performBatch: computation_class=journey_step treats all payloads as add', async () => {
    let capturedBody: any

    nock(DM_HOST)
      .post(DM_INGEST_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'jstep-1' })

    // journey_step is extracted from events[0].context.personas by executeBatch
    const events: SegmentEvent[] = [
      createTestEvent({
        timestamp,
        type: 'track',
        event: 'Some Event',
        context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } },
        properties: { email: 'a@example.com' }
      }),
      createTestEvent({
        timestamp,
        type: 'track',
        event: 'Some Event',
        context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } },
        properties: { email: 'b@example.com' }
      })
    ]

    await testDestination.executeBatch('userList', {
      events,
      mapping: batchMapping,
      settings: { customerId: cid }
    })

    expect(capturedBody.audienceMembers).toHaveLength(2)
    // No remove call should have been made
    expect(nock.pendingMocks()).toHaveLength(0)
  })
})
