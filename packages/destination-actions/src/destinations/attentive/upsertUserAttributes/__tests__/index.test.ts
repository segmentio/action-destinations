import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'

const settings: Settings = {
  apiKey: 'test-api-key'
}

const validPayload = {
  timestamp,
  event: 'Custom Attribute Event',
  messageId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'track',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  context: {
    traits: {
      phone: '+3538675765689',
      email: 'test@test.com'
    }
  },
  properties: {
    age: '24',
    birthday: '1986-11-16',
    'sign up': '2021-04-23T16:04:33Z',
    'favorite team': 'Minnesota Vikings',
    'Gift card balance': '50.89',
    VIP: 'TRUE'
  }
} as Partial<SegmentEvent>

const mapping = {
  userIdentifiers: {
    phone: { '@path': '$.context.traits.phone' },
    email: { '@path': '$.context.traits.email' },
    clientUserId: { '@path': '$.userId' }
  },
  properties: { '@path': '$.properties' }
}

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Attentive.upsertUserAttributes', () => {
  it('should send custom attributes to Attentive', async () => {
    const event = createTestEvent(validPayload)

    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json'
      }
    })
      .post('/v1/attributes/custom', (body) => {
        return (
          body &&
          body.properties.age === '24' &&
          body.properties.birthday === '1986-11-16' &&
          body.properties['sign up'] === '2021-04-23T16:04:33Z' &&
          body.properties['favorite team'] === 'Minnesota Vikings' &&
          body.properties['Gift card balance'] === '50.89' &&
          body.properties.VIP === 'TRUE' &&
          body.user &&
          body.user.phone === '+3538675765689' &&
          body.user.email === 'test@test.com' &&
          body.user.externalIdentifiers &&
          body.user.externalIdentifiers.clientUserId === '123e4567-e89b-12d3-a456-426614174000'
        )
      })
      .reply(200, {})

    const responses = await testDestination.testAction('upsertUserAttributes', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw error if no identifiers provided', async () => {
    const badPayload = {
      ...validPayload
    }
    delete badPayload?.context?.traits?.phone
    delete badPayload?.context?.traits?.email
    badPayload.userId = undefined

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('upsertUserAttributes', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier is required.'))
  })
})
