import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { validateAudienceDetails, buildMember, getAudienceType, buildConsent } from '../functions'
import type { Payload } from '../generated-types'
import { processHashing } from '../../../../lib/hashing-utils'

const testDestination = createTestIntegration(Destination)

const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const CONTACT_INFO = 'CUSTOMER_MATCH_CONTACT_INFO'
const DEVICE_ID = 'CUSTOMER_MATCH_DEVICE_ID'
const DV360_HOST = 'https://displayvideo.googleapis.com'
const EDIT_PATH = `/v4/firstPartyAndPartnerAudiences/${AUDIENCE_ID}:editCustomerMatchMembers`

const hash = (value: string): string =>
  processHashing(value, 'sha256', 'hex', (v) => v.replace(/\s+/g, '').toLowerCase())

interface EventOptions {
  membership?: boolean | null
  audienceType?: string
  email?: string
  phone?: string
  mobileDeviceId?: string
  firstName?: string
  lastName?: string
  zipCode?: string
  countryCode?: string
  adUserData?: string
  adPersonalization?: string
  enableBatching?: unknown
}

const makeEvent = ({
  membership = true,
  audienceType = CONTACT_INFO,
  email,
  phone,
  mobileDeviceId,
  firstName,
  lastName,
  zipCode,
  countryCode,
  adUserData,
  adPersonalization,
  enableBatching = true
}: EventOptions = {}) =>
  createTestEvent({
    type: 'track',
    event: 'Audience Entered',
    context: {
      personas: {
        computation_class: 'journey_step',
        computation_key: 'my_audience',
        external_audience_id: AUDIENCE_ID,
        audience_settings: {
          advertiserId: ADVERTISER_ID,
          audienceType
        }
      },
      traits: {
        email,
        phone,
        mobileDeviceIds: mobileDeviceId,
        firstName,
        lastName,
        zipCodes: zipCode,
        countryCode
      }
    },
    properties: {
      ...(membership === null ? {} : { my_audience: membership }),
      adUserData,
      adPersonalization,
      enableBatching
    }
  })

const mapping = {
  audience_type: CONTACT_INFO,
  contact_info: {
    emails: { '@path': '$.context.traits.email' },
    phoneNumbers: { '@path': '$.context.traits.phone' },
    firstName: { '@path': '$.context.traits.firstName' },
    lastName: { '@path': '$.context.traits.lastName' },
    zipCodes: { '@path': '$.context.traits.zipCodes' },
    countryCode: { '@path': '$.context.traits.countryCode' }
  },
  mobileDeviceIds: { '@path': '$.context.traits.mobileDeviceIds' },
  consent: {
    adUserData: {
      '@if': {
        exists: { '@path': '$.properties.adUserData' },
        then: { '@path': '$.properties.adUserData' },
        else: 'CONSENT_STATUS_GRANTED'
      }
    },
    adPersonalization: {
      '@if': {
        exists: { '@path': '$.properties.adPersonalization' },
        then: { '@path': '$.properties.adPersonalization' },
        else: 'CONSENT_STATUS_GRANTED'
      }
    }
  },
  external_id: { '@path': '$.context.personas.external_audience_id' },
  enable_batching: { '@path': '$.properties.enableBatching' },
  batch_size: 500000
}

const GRANTED_CONSENT = {
  adUserData: 'CONSENT_STATUS_GRANTED',
  adPersonalization: 'CONSENT_STATUS_GRANTED'
}

const API_RESPONSE = { firstPartyAndPartnerAudienceId: AUDIENCE_ID }

// A mixed batch goes out as one request, so tests capture the single body sent.
const captureBody = () => {
  const captured: { body?: any } = {}
  const scope = nock(DV360_HOST)
    .post(EDIT_PATH, (b) => {
      captured.body = b
      return true
    })
    .once()
    .reply(200, API_RESPONSE)
  return { captured, scope }
}

afterEach(() => {
  nock.cleanAll()
})

describe('validateAudienceDetails', () => {
  it('returns undefined when everything is present and valid', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, CONTACT_INFO)).toBeUndefined()
  })

  it('reports every missing value in one message', () => {
    expect(validateAudienceDetails()).toBe('Missing audience ID. Missing advertiser ID. Missing audience type')
  })

  it('combines a missing value with an invalid one', () => {
    expect(validateAudienceDetails(undefined, ADVERTISER_ID, 'SOMETHING_ELSE')).toBe(
      `Missing audience ID. Unrecognised audience type: SOMETHING_ELSE. Must be ${CONTACT_INFO} or ${DEVICE_ID}`
    )
  })

  it('does not report an unrecognised type when the type is missing', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID)).toBe('Missing audience type')
  })

  it('reports a mapped audience type that disagrees with the configured one', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, DEVICE_ID, CONTACT_INFO)).toBe(
      `Audience Type is set to ${CONTACT_INFO} in this mapping, but the audience in Display & Video 360 is ${DEVICE_ID}. Set Audience Type to ${DEVICE_ID} so that the mapping shows the identifier fields that audience accepts, or connect this mapping to a ${CONTACT_INFO} audience`
    )
  })

  it('does not compare when there is no resolved audience type to compare against', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, undefined, CONTACT_INFO)).toBe('Missing audience type')
  })
})

describe('getAudienceType', () => {
  it('prefers the hook output over the audience settings', () => {
    expect(
      getAudienceType(
        { audienceType: CONTACT_INFO } as never,
        {
          retlOnMappingSave: { outputs: { audienceType: DEVICE_ID } }
        } as never
      )
    ).toBe(DEVICE_ID)
  })

  it('falls back to the audience settings', () => {
    expect(getAudienceType({ audienceType: DEVICE_ID } as never)).toBe(DEVICE_ID)
  })

  it('never reads the mapped field, which is only there to be validated against', () => {
    expect(getAudienceType()).toBeUndefined()
  })
})

describe('buildConsent', () => {
  it('rejects a consent value that is neither granted nor denied', () => {
    expect(buildConsent({ consent: { adUserData: 'MAYBE' } } as unknown as Payload).consentErrorMessage).toBe(
      'Unrecognised consent value: MAYBE. Must be CONSENT_STATUS_GRANTED or CONSENT_STATUS_DENIED.'
    )
  })
})

describe('buildMember', () => {
  const target = { audienceId: AUDIENCE_ID, advertiserId: ADVERTISER_ID, audienceType: CONTACT_INFO }
  const payload = {
    contact_info: { emails: 'a@example.com' },
    external_id: AUDIENCE_ID
  } as Payload

  it('returns the member for a valid payload', () => {
    expect(buildMember(payload, true, target)).toEqual({ members: [{ hashedEmails: [hash('a@example.com')] }] })
  })

  it('splits a comma separated list of mobile device IDs into one member each', () => {
    expect(
      buildMember({ ...payload, mobileDeviceIds: 'device-1, device-2' }, true, {
        ...target,
        audienceType: 'CUSTOMER_MATCH_DEVICE_ID'
      })
    ).toEqual({ members: ['device-1', 'device-2'] })
  })

  it('rejects an unresolved membership', () => {
    expect(buildMember(payload, undefined, target)).toEqual({
      errortype: 'INVALID_AUDIENCE_MEMBERSHIP',
      errormessage: 'Audience membership could not be resolved to a boolean'
    })
  })

  it('rejects an event for a different audience', () => {
    const result = buildMember({ ...payload, external_id: 'another-audience' }, true, target)
    expect(result.errormessage).toContain('does not belong to the same audience')
  })

  it('rejects an event with no usable identifier', () => {
    const result = buildMember({ external_id: AUDIENCE_ID } as Payload, true, target)
    expect(result.errormessage).toContain('No usable contact info identifiers')
  })

  it('rejects a device ID audience event with no device ID', () => {
    const result = buildMember(payload, true, { ...target, audienceType: DEVICE_ID })
    expect(result.errormessage).toContain('No mobile device ID')
  })
})

describe('FirstPartyDv360.syncAudience', () => {
  it('adds a contact info member', async () => {
    let body: any
    nock(DV360_HOST)
      .post(EDIT_PATH, (b) => {
        body = b
        return true
      })
      .reply(200, API_RESPONSE)

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: 'Test@Example.com ' }),
      mapping,
      useDefaultMappings: false
    })

    expect(body).toEqual({
      advertiserId: ADVERTISER_ID,
      addedContactInfoList: {
        contactInfos: [{ hashedEmails: [hash('test@example.com')] }],
        consent: GRANTED_CONSENT
      }
    })
  })

  it('removes a contact info member', async () => {
    let body: any
    nock(DV360_HOST)
      .post(EDIT_PATH, (b) => {
        body = b
        return true
      })
      .reply(200, API_RESPONSE)

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: false, email: 'test@example.com' }),
      mapping,
      useDefaultMappings: false
    })

    expect(body).toEqual({
      advertiserId: ADVERTISER_ID,
      removedContactInfoList: {
        contactInfos: [{ hashedEmails: [hash('test@example.com')] }],
        consent: GRANTED_CONSENT
      }
    })
  })

  it('sends adds and removes in a single request for a mixed batch', async () => {
    const { captured, scope } = captureBody()

    await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, email: 'add1@example.com' }),
        makeEvent({ membership: false, email: 'remove1@example.com' }),
        makeEvent({ membership: true, email: 'add2@example.com' })
      ],
      mapping
    })

    expect(scope.isDone()).toBe(true)
    expect(captured.body).toEqual({
      advertiserId: ADVERTISER_ID,
      addedContactInfoList: {
        contactInfos: [{ hashedEmails: [hash('add1@example.com')] }, { hashedEmails: [hash('add2@example.com')] }],
        consent: GRANTED_CONSENT
      },
      removedContactInfoList: {
        contactInfos: [{ hashedEmails: [hash('remove1@example.com')] }],
        consent: GRANTED_CONSENT
      }
    })
  })

  it('omits the removed list when a batch is all adds', async () => {
    const { captured, scope } = captureBody()

    await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, email: 'add1@example.com' }),
        makeEvent({ membership: true, email: 'add2@example.com' })
      ],
      mapping
    })

    expect(scope.isDone()).toBe(true)
    expect(captured.body.removedContactInfoList).toBeUndefined()
  })

  it('sends mobile device IDs for a device ID audience', async () => {
    const { captured } = captureBody()

    await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, audienceType: DEVICE_ID, mobileDeviceId: 'device-1' }),
        makeEvent({ membership: false, audienceType: DEVICE_ID, mobileDeviceId: 'device-2' })
      ],
      mapping: { ...mapping, audience_type: DEVICE_ID }
    })

    expect(captured.body).toEqual({
      advertiserId: ADVERTISER_ID,
      addedMobileDeviceIdList: { mobileDeviceIds: ['device-1'], consent: GRANTED_CONSENT },
      removedMobileDeviceIdList: { mobileDeviceIds: ['device-2'], consent: GRANTED_CONSENT }
    })
  })

  it('does not hash an already hashed email', async () => {
    const hashedEmail = hash('test@example.com')
    let body: any
    nock(DV360_HOST)
      .post(EDIT_PATH, (b) => {
        body = b
        return true
      })
      .reply(200, API_RESPONSE)

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: hashedEmail }),
      mapping,
      useDefaultMappings: false
    })

    expect(body.addedContactInfoList.contactInfos[0].hashedEmails).toEqual([hashedEmail])
  })

  it('splits a comma separated list into several identifiers', async () => {
    const { captured } = captureBody()

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: 'one@example.com, two@example.com ,three@example.com' }),
      mapping,
      useDefaultMappings: false
    })

    expect(captured.body.addedContactInfoList.contactInfos).toEqual([
      {
        hashedEmails: [hash('one@example.com'), hash('two@example.com'), hash('three@example.com')]
      }
    ])
  })

  it('lowercases an already hashed value sent in upper case', async () => {
    const { captured } = captureBody()

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: hash('test@example.com').toUpperCase() }),
      mapping,
      useDefaultMappings: false
    })

    expect(captured.body.addedContactInfoList.contactInfos[0].hashedEmails).toEqual([hash('test@example.com')])
  })

  it('only sends the address group when it is complete', async () => {
    let body: any
    nock(DV360_HOST)
      .post(EDIT_PATH, (b) => {
        body = b
        return true
      })
      .reply(200, API_RESPONSE)

    await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({
          membership: true,
          email: 'complete@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          zipCode: '90210',
          countryCode: 'US'
        }),
        // Partial address. Google rejects zipCodes without the name and country fields,
        // so the address group is dropped and only the email is sent.
        makeEvent({ membership: true, email: 'partial@example.com', zipCode: '90210' })
      ],
      mapping
    })

    expect(body.addedContactInfoList.contactInfos).toEqual([
      {
        hashedEmails: [hash('complete@example.com')],
        hashedFirstName: hash('jane'),
        hashedLastName: hash('doe'),
        zipCodes: ['90210'],
        countryCode: 'US'
      },
      { hashedEmails: [hash('partial@example.com')] }
    ])
  })

  it('omits consent when the event does not carry it', async () => {
    const { captured } = captureBody()

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: 'a@example.com' }),
      // The consent field is deliberately left unmapped.
      mapping: { ...mapping, consent: undefined },
      useDefaultMappings: false
    })

    expect(captured.body.addedContactInfoList.consent).toBeUndefined()
    expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('a@example.com')] }])
  })

  it('sends only the consent fields the event carries', async () => {
    const { captured } = captureBody()

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: 'a@example.com' }),
      mapping: { ...mapping, consent: { adUserData: mapping.consent.adUserData } },
      useDefaultMappings: false
    })

    expect(captured.body.addedContactInfoList.consent).toEqual({ adUserData: 'CONSENT_STATUS_GRANTED' })
  })

  it('fails the whole batch when consent is denied', async () => {
    const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

    // batch_keys pins a batch to one combination of consent values, so a batch carrying denied
    // consent carries it on every event.
    const responses = await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, email: 'a@example.com', adUserData: 'CONSENT_STATUS_DENIED' }),
        makeEvent({ membership: true, email: 'b@example.com', adUserData: 'CONSENT_STATUS_DENIED' })
      ],
      mapping
    })

    // Consent belongs to the list, so a denied event cannot be dropped while the rest are sent.
    expect(scope.isDone()).toBe(false)
    expect(responses[0].status).toBe(400)
    expect(responses[1].status).toBe(400)
    expect((responses[0] as any).errormessage).toContain('Consent denied')
  })

  it('throws for a single event with no usable identifier', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true }),
        mapping,
        useDefaultMappings: false
      })
    ).rejects.toThrow('No usable contact info identifiers')
  })

  it('throws for a single event whose membership cannot be resolved', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: null, email: 'a@example.com' }),
        mapping,
        useDefaultMappings: false
      })
    ).rejects.toThrow('Audience membership could not be resolved')
  })

  it('drops an event belonging to a different audience', async () => {
    const { captured } = captureBody()

    const otherAudienceEvent = makeEvent({ membership: true, email: 'other@example.com' })
    ;(otherAudienceEvent.context as any).personas.external_audience_id = 'a-different-audience'

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [makeEvent({ membership: true, email: 'right@example.com' }), otherAudienceEvent],
      mapping
    })

    expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('right@example.com')] }])
    expect(responses[1].status).toBe(400)
    expect((responses[1] as any).errormessage).toContain('does not belong to the same audience')
  })

  it('throws for a single event when a batch level value is missing', async () => {
    const { external_id, ...mappingWithoutAudience } = mapping

    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, email: 'a@example.com' }),
        mapping: mappingWithoutAudience,
        useDefaultMappings: false
      })
    ).rejects.toThrow('Missing audience ID')

    expect(external_id).toBeDefined()
  })

  it('takes the advertiser ID from the audience settings, not from a mapped field', async () => {
    const { captured } = captureBody()

    await testDestination.testAction('syncAudience', {
      event: makeEvent({ membership: true, email: 'a@example.com' }),
      mapping,
      useDefaultMappings: false
    })

    expect(captured.body.advertiserId).toBe(ADVERTISER_ID)
  })

  it('fails the batch when the mapped audience type disagrees with the audience', async () => {
    const responses = await testDestination.executeBatch('syncAudience', {
      events: [makeEvent({ membership: true, audienceType: DEVICE_ID, mobileDeviceId: 'device-1' })],
      mapping
    })

    expect(JSON.parse(JSON.stringify(responses))).toEqual([
      {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errorreporter: 'DESTINATION',
        errormessage: `Audience Type is set to ${CONTACT_INFO} in this mapping, but the audience in Display & Video 360 is ${DEVICE_ID}. Set Audience Type to ${DEVICE_ID} so that the mapping shows the identifier fields that audience accepts, or connect this mapping to a ${CONTACT_INFO} audience`,
        sent: expect.any(Object)
      }
    ])
  })

  it('rejects an unrecognised audience type before sending', async () => {
    const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [makeEvent({ membership: true, email: 'a@example.com', audienceType: 'SOMETHING_ELSE' })],
      mapping
    })

    expect(scope.isDone()).toBe(false)
    expect(responses[0].status).toBe(400)
    expect((responses[0] as any).errormessage).toContain('Unrecognised audience type')
  })

  it('makes no request when every event fails validation', async () => {
    const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [makeEvent({ membership: true }), makeEvent({ membership: true })],
      mapping
    })

    expect(scope.isDone()).toBe(false)
    expect(responses[0].status).toBe(400)
    expect(responses[1].status).toBe(400)
  })

  it('reports a 4xx from Display & Video 360 against every sent event', async () => {
    nock(DV360_HOST)
      .post(EDIT_PATH)
      .reply(400, { error: { code: 400, message: 'Invalid advertiser', status: 'INVALID_ARGUMENT' } })

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, email: 'a@example.com' }),
        makeEvent({ membership: false, email: 'b@example.com' })
      ],
      mapping
    })

    expect(responses[0].status).toBe(400)
    expect((responses[0] as any).errormessage).toBe('Invalid advertiser')
    expect((responses[1] as any).errormessage).toBe('Invalid advertiser')
  })

  it('reports a 401 so the token is refreshed and the batch retried', async () => {
    nock(DV360_HOST)
      .post(EDIT_PATH)
      .reply(401, { error: { code: 401, message: 'Invalid Credentials' } })

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [makeEvent({ membership: true, email: 'a@example.com' })],
      mapping
    })

    // Core looks for a 401 in the MultiStatusResponse to trigger a token refresh and retry.
    expect(responses[0].status).toBe(401)
    expect((responses[0] as any).errortype).toBe('INVALID_AUTHENTICATION')
  })

  it('reports a 5xx as a retryable error against every sent event', async () => {
    nock(DV360_HOST).post(EDIT_PATH).reply(500, {})

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, email: 'a@example.com' }),
        makeEvent({ membership: false, email: 'b@example.com' })
      ],
      mapping
    })

    expect(responses[0].status).toBe(500)
    expect((responses[0] as any).errortype).toBe('RETRYABLE_ERROR')
    expect((responses[1] as any).errortype).toBe('RETRYABLE_ERROR')
  })

  it('throws a retryable error for a single event on a 5xx', async () => {
    nock(DV360_HOST).post(EDIT_PATH).reply(500, {})

    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, email: 'a@example.com' }),
        mapping,
        useDefaultMappings: false
      })
    ).rejects.toThrow('Display & Video 360 rejected the request')
  })

  it('fully asserts the MultiStatusResponse for a mixed batch of 10 events', async () => {
    const { captured, scope } = captureBody()

    const otherAudienceEvent = makeEvent({ membership: true, email: 'otheraudience@example.com' })
    ;(otherAudienceEvent.context as any).personas.external_audience_id = 'a-different-audience'

    const events = [
      // 0 add, sent
      makeEvent({ membership: true, email: 'add1@example.com' }),
      // 1 remove, sent
      makeEvent({ membership: false, email: 'remove1@example.com' }),
      // 2 dropped BEFORE performBatch: enable_batching is required and is not a boolean
      makeEvent({ membership: true, email: 'nobatching1@example.com', enableBatching: 'yes' }),
      // 3 add, sent
      makeEvent({ membership: true, phone: '+15555555555' }),
      // 4 dropped INSIDE performBatch: no usable identifier
      makeEvent({ membership: true }),
      // 5 remove, sent
      makeEvent({ membership: false, email: 'remove2@example.com' }),
      // 6 dropped INSIDE performBatch: membership cannot be resolved to a boolean
      makeEvent({ membership: null, email: 'nomembership@example.com' }),
      // 7 dropped BEFORE performBatch: enable_batching is required and is not a boolean
      makeEvent({ membership: false, email: 'nobatching2@example.com', enableBatching: 'yes' }),
      // 8 dropped INSIDE performBatch: belongs to a different audience
      otherAudienceEvent,
      // 9 add, sent
      makeEvent({ membership: true, email: 'add3@example.com' })
    ]

    const responses = await testDestination.executeBatch('syncAudience', { events, mapping })

    expect(scope.isDone()).toBe(true)

    // Only the valid events reached the API, in one request, adds first then removes.
    expect(captured.body).toEqual({
      advertiserId: ADVERTISER_ID,
      addedContactInfoList: {
        contactInfos: [
          { hashedEmails: [hash('add1@example.com')] },
          { hashedPhoneNumbers: [hash('+15555555555')] },
          { hashedEmails: [hash('add3@example.com')] }
        ],
        consent: GRANTED_CONSENT
      },
      removedContactInfoList: {
        contactInfos: [
          { hashedEmails: [hash('remove1@example.com')] },
          { hashedEmails: [hash('remove2@example.com')] }
        ],
        consent: GRANTED_CONSENT
      }
    })

    const success = (sent: Record<string, unknown>) => ({ status: 200, sent: [sent], body: { success: true } })

    // Every index is asserted, in order, proving index alignment survives both drop points.
    expect(JSON.parse(JSON.stringify(responses))).toEqual([
      success({ hashedEmails: [hash('add1@example.com')] }),
      success({ hashedEmails: [hash('remove1@example.com')] }),
      {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errorreporter: 'INTEGRATIONS',
        errormessage: 'Enable Batching must be a boolean but it was a string.'
      },
      success({ hashedPhoneNumbers: [hash('+15555555555')] }),
      {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errorreporter: 'DESTINATION',
        errormessage: expect.stringContaining('No usable contact info identifiers'),
        sent: expect.objectContaining({ external_id: AUDIENCE_ID })
      },
      success({ hashedEmails: [hash('remove2@example.com')] }),
      {
        status: 400,
        errortype: 'INVALID_AUDIENCE_MEMBERSHIP',
        errorreporter: 'DESTINATION',
        errormessage: 'Audience membership could not be resolved to a boolean',
        sent: expect.objectContaining({ contact_info: { emails: 'nomembership@example.com' } })
      },
      {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errorreporter: 'INTEGRATIONS',
        errormessage: 'Enable Batching must be a boolean but it was a string.'
      },
      {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errorreporter: 'DESTINATION',
        errormessage: expect.stringContaining('does not belong to the same audience'),
        sent: expect.objectContaining({ contact_info: { emails: 'otheraudience@example.com' } })
      },
      success({ hashedEmails: [hash('add3@example.com')] })
    ])
  })
})
