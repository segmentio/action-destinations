import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { validate } from '../functions'
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
  emails: { '@path': '$.context.traits.email' },
  phoneNumbers: { '@path': '$.context.traits.phone' },
  mobileDeviceIds: { '@path': '$.context.traits.mobileDeviceIds' },
  firstName: { '@path': '$.context.traits.firstName' },
  lastName: { '@path': '$.context.traits.lastName' },
  zipCodes: { '@path': '$.context.traits.zipCodes' },
  countryCode: { '@path': '$.context.traits.countryCode' },
  ad_user_data: {
    '@if': {
      exists: { '@path': '$.properties.adUserData' },
      then: { '@path': '$.properties.adUserData' },
      else: 'CONSENT_STATUS_GRANTED'
    }
  },
  ad_personalization: {
    '@if': {
      exists: { '@path': '$.properties.adPersonalization' },
      then: { '@path': '$.properties.adPersonalization' },
      else: 'CONSENT_STATUS_GRANTED'
    }
  },
  external_id: { '@path': '$.context.personas.external_audience_id' },
  advertiser_id: { '@path': '$.context.personas.audience_settings.advertiserId' },
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

describe('validate', () => {
  it('returns undefined when everything is present and valid', () => {
    expect(validate(AUDIENCE_ID, ADVERTISER_ID, CONTACT_INFO)).toBeUndefined()
  })

  it('reports every missing value in one message', () => {
    expect(validate(undefined, undefined, undefined)).toBe(
      'Missing audience ID. Missing advertiser ID. Missing audience type'
    )
  })

  it('combines a missing value with an invalid one', () => {
    expect(validate(undefined, ADVERTISER_ID, 'SOMETHING_ELSE')).toBe(
      `Missing audience ID. Unrecognised audience type: SOMETHING_ELSE. Must be ${CONTACT_INFO} or ${DEVICE_ID}`
    )
  })

  it('does not report an unrecognised type when the type is missing', () => {
    expect(validate(AUDIENCE_ID, ADVERTISER_ID, undefined)).toBe('Missing audience type')
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
      mapping
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

  it('does not send events with denied consent', async () => {
    const { captured } = captureBody()

    const responses = await testDestination.executeBatch('syncAudience', {
      events: [
        makeEvent({ membership: true, email: 'granted@example.com' }),
        makeEvent({ membership: true, email: 'denied@example.com', adUserData: 'CONSENT_STATUS_DENIED' })
      ],
      mapping
    })

    expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('granted@example.com')] }])
    expect(responses[1].status).toBe(400)
    expect((responses[1] as any).errormessage).toContain('Consent denied')
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
    const { advertiser_id, ...mappingWithoutAdvertiser } = mapping

    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, email: 'a@example.com' }),
        mapping: mappingWithoutAdvertiser,
        useDefaultMappings: false
      })
    ).rejects.toThrow('Missing advertiser ID')

    expect(advertiser_id).toBeDefined()
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

  it('throws on a 5xx so the whole batch is retried', async () => {
    nock(DV360_HOST).post(EDIT_PATH).reply(500, {})

    await expect(
      testDestination.executeBatch('syncAudience', {
        events: [makeEvent({ membership: true, email: 'a@example.com' })],
        mapping
      })
    ).rejects.toThrow()
  })

  it('fully asserts the MultiStatusResponse for a mixed batch of 10 events', async () => {
    const { captured, scope } = captureBody()

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
      // 8 dropped INSIDE performBatch: consent denied
      makeEvent({ membership: true, email: 'denied@example.com', adPersonalization: 'CONSENT_STATUS_DENIED' }),
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

    const success = (sent: Record<string, unknown>) => ({ status: 200, sent, body: API_RESPONSE })

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
        sent: expect.objectContaining({ emails: 'nomembership@example.com' })
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
        errormessage: expect.stringContaining('Consent denied'),
        sent: expect.objectContaining({ emails: 'denied@example.com' })
      },
      success({ hashedEmails: [hash('add3@example.com')] })
    ])
  })
})
