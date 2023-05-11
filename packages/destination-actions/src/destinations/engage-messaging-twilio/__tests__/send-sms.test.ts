import nock from 'nock'
import { createTestIntegration, omit } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import Twilio from '..'
import { Logger } from '@segment/actions-core/src/destination-kit'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()

function createLoggerMock()
{
  return { level: 'error', name: 'test', error: jest.fn() as Logger['error'], info: jest.fn() as Logger['info'] } as Logger
}

describe.each(['stage', 'production'])('%s environment', (environment) => {
  const contentSid = 'g'
  const spaceId = 'd'
  const settings = {
    twilioAccountSID: 'a',
    twilioApiKeySID: 'f',
    twilioApiKeySecret: 'b',
    profileApiEnvironment: environment,
    profileApiAccessToken: 'c',
    spaceId,
    sourceId: 'e'
  }
  const getDefaultMapping = (overrides?: any) => {
    return {
      userId: { '@path': '$.userId' },
      from: 'MG1111222233334444',
      body: 'Hello world, {{profile.user_id}}!',
      send: true,
      traitEnrichment: true,
      externalIds: [
        { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
        { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed', channelType: 'sms' }
      ],
      ...overrides
    }
  }

  const topLevelName = environment === 'production' ? 'com' : 'build'
  const endpoint = `https://profiles.segment.${topLevelName}`

  afterEach(() => {
    twilio.responses = []
  })

  describe('send SMS', () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
        traits: {}
      })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should abort when there is no `phone` external ID in the payload', async () => {
      const responses = await twilio.testAction('sendSms', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          externalIds: [{ type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' }]
        })
      })

      expect(responses.length).toEqual(0)
    })

    it('should throw error with no userId and no trait enrichment', async () => {
      const logger = createLoggerMock()

      const mapping = getDefaultMapping({
        userId: undefined,
        traitEnrichment: false
      })
      await expect(
        twilio.testAction('sendSms', {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: 'jane'
          }),
          settings,
          mapping,
          logger
        })
      ).rejects.toThrowError('Unable to process sms, no userId provided and no traits provided')
      expect(logger.error).toHaveBeenCalledWith(
        `TE Messaging: Unable to process SMS, no userId provided and no traits provided - ${spaceId}`,
        expect.anything()
      )
    })

    it('should throw error if unable to parse liquid template', async () => {
      const logger = createLoggerMock()

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          body: 'Hello world, {{profile.user_id$}}!!'
        }),
        logger
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unable to parse templating in SMS'
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^TE Messaging: SMS templating parse failure - ${spaceId}`)),
        expect.anything()
      )
    })

    it('should thow error if no body provided and no contentSid provided', async () => {
      const logger = createLoggerMock()

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: omit(getDefaultMapping(), ['body']),
        logger
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unable to process sms, no body provided and no content sid provided'
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`^TE Messaging: Unable to process SMS, no body provided and no content sid provided - ${spaceId}`)
        ),
        expect.anything()
      )
    })

    it.each(['twilio/call-to-action', 'twilio/card', 'twilio/quick-reply', 'twilio/list-picker'])(
      'should throw error if template content type is not "twilio/text" or "twilio/media"',
      async (contentType) => {
        const logger = createLoggerMock()

        const twilioContentResponse = {
          types: {
            [contentType]: {
              body: 'Hello world, {{profile.user_id}}!'
            }
          }
        }

        nock('https://content.twilio.com').get(`/v1/Content/${contentSid}`).reply(200, twilioContentResponse)

        const actionInputData = {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: 'jane'
          }),
          settings,
          mapping: omit(
            getDefaultMapping({
              contentSid
            }),
            ['body']
          ),
          logger
        }

        await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError('Unsupported content type')
        expect(logger.error).toHaveBeenCalledWith(
          `TE Messaging: SMS unsupported content template type '${contentType}' - ${spaceId}`,
          expect.anything()
        )
      }
    )

    it('should throw error if template does not include a "types" key', async () => {
      const logger = createLoggerMock()

      const twilioContentResponse = {
        langugage: 'en',
        friendly_name: 'my_template',
        sid: contentSid
      }

      nock('https://content.twilio.com').get(`/v1/Content/${contentSid}`).reply(200, twilioContentResponse)

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: omit(
          getDefaultMapping({
            contentSid
          }),
          ['body']
        ),
        logger
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unexpected response from Twilio Content API'
      )
      expect(logger.error).toHaveBeenCalledWith(
        `TE Messaging: SMS template from Twilio Content API does not contain a template type - ${spaceId} - [${JSON.stringify(
          twilioContentResponse
        )}]`,
        expect.anything()
      )
    })

    it('should throw error if Twilio Content API request fails', async () => {
      const logger = createLoggerMock()

      const expectedErrorResponse = {
        code: 20404,
        message: 'The requested resource was not found',
        more_info: 'https://www.twilio.com/docs/errors/20404',
        status: 404
      }

      nock('https://content.twilio.com').get(`/v1/Content/${contentSid}`).reply(404, expectedErrorResponse)

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: omit(
          getDefaultMapping({
            contentSid
          }),
          ['body']
        ),
        logger
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unable to fetch content template'
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`^TE Messaging: SMS failed request to fetch content template from Twilio Content API - ${spaceId}`)
        ),
        expect.anything()
      )
    })

    it('should throw error if Twilio Programmable Messaging API request fails', async () => {
      const logger = createLoggerMock()

      const expectedErrorResponse = {
        code: 21211,
        message: "The 'To' number is not a valid phone number.",
        more_info: 'https://www.twilio.com/docs/errors/21211',
        status: 400
      }

      nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(400, expectedErrorResponse)

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping(),
        logger
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError()
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^TE Messaging: Twilio Programmable API error - ${spaceId}`)),
        expect.anything()
      )
    })

    it('should send SMS', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping()
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send SMS with content sid', async () => {
      const twilioMessagingRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json')
        .reply(201, {})

      const twilioContentResponse = {
        types: {
          'twilio/text': {
            body: 'Hello world, {{profile.user_id}}!'
          }
        }
      }

      const twilioContentRequest = nock('https://content.twilio.com')
        .get(`/v1/Content/${contentSid}`)
        .reply(200, twilioContentResponse)

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: omit(
          getDefaultMapping({
            contentSid
          }),
          ['body']
        )
      }

      await twilio.testAction('sendSms', actionInputData)
      expect(twilioMessagingRequest.isDone()).toEqual(true)
      expect(twilioContentRequest.isDone()).toEqual(true)
    })

    it('should send MMS with media in payload', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true',
        MediaUrl: 'http://myimg.com'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          media: ['http://myimg.com']
        })
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send MMS', async () => {
      const twilioContentResponse = {
        types: {
          'twilio/media': {
            body: 'Hello world, {{profile.user_id}}!',
            media: ['https://catpic.com/fluffy']
          }
        }
      }

      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true'
      })

      twilioContentResponse.types['twilio/media'].media.forEach((media) => {
        expectedTwilioRequest.append('MediaUrl', media)
      })

      const twilioContentRequest = nock('https://content.twilio.com')
        .get(`/v1/Content/${contentSid}`)
        .reply(200, twilioContentResponse)

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: omit(
          getDefaultMapping({
            contentSid
          }),
          ['body']
        )
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://content.twilio.com/v1/Content/g',
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
      expect(twilioContentRequest.isDone()).toEqual(true)
    })

    it('should send SMS for custom hostname', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true'
      })

      const twilioHostname = 'api.nottwilio.com'

      const twilioRequest = nock(`https://${twilioHostname}/2010-04-01/Accounts/a`)
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          twilioHostname
        },
        mapping: getDefaultMapping()
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        `https://${twilioHostname}/2010-04-01/Accounts/a/Messages.json`
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send SMS with custom metadata', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true',
        StatusCallback:
          'http://localhost/?foo=bar&space_id=d&__segment_internal_external_id_key__=phone&__segment_internal_external_id_value__=%2B1234567891#rp=all&rc=5'
      })
      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'http://localhost',
          connectionOverrides: 'rp=all&rc=5'
        },
        mapping: getDefaultMapping({ customArgs: { foo: 'bar' } })
      }

      const responses = await twilio.testAction('sendSms', actionInputData)

      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should fail on invalid webhook url', async () => {
      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'foo'
        },
        mapping: getDefaultMapping({ customArgs: { foo: 'bar' } })
      }
      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toHaveProperty('code', 'ERR_INVALID_URL')
    })

    it.each([
      {
        region: 'us-west-2',
        domain: 'profiles.segment'
      },
      {
        region: 'eu-west-1',
        domain: 'profiles.euw1.segment'
      }
    ])('%s', async ({ region, domain }) => {
      nock.cleanAll()
      // mock the correct endpoint
      const topLevelName = environment === 'production' ? 'com' : 'build'
      const profileApiEndpoint = `https://${domain}.${topLevelName}/v1/spaces/d/collections/users/profiles/user_id:jane`
      const profilesApiMock = nock(profileApiEndpoint).get('/traits?limit=200').reply(200, { traits: {} })

      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          region
        },
        mapping: getDefaultMapping({
          traitEnrichment: false
        })
      }

      const responses = await twilio.testAction('sendSms', actionInputData)

      expect(responses.map((response) => response.url)).toStrictEqual([
        `${profileApiEndpoint}/traits?limit=200`,
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toBe(true)
      expect(profilesApiMock.isDone()).toBe(true)
    })
  })

  describe('subscription handling', () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
        traits: {}
      })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it.each(['subscribed', true])('sends an SMS when subscriptonStatus ="%s"', async (subscriptionStatus) => {
      // eslint-disable-next-line no-debugger
      debugger;
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({ externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'sms' }] })
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it.each(['unsubscribed', 'did not subscribed', false, null])(
      'does NOT send an SMS when subscriptonStatus ="%s"',
      async (subscriptionStatus) => {
        const expectedTwilioRequest = new URLSearchParams({
          Body: 'Hello world, jane!',
          From: 'MG1111222233334444',
          To: '+1234567891',
          ShortenUrls: 'true'
        })

        const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
          .post('/Messages.json', expectedTwilioRequest.toString())
          .reply(201, {})

        const actionInputData = {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: 'jane'
          }),
          settings,
          mapping: getDefaultMapping({ externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'sms' }] })
        }

        const responses = await twilio.testAction('sendSms', actionInputData)
        expect(responses).toHaveLength(0)
        expect(twilioRequest.isDone()).toEqual(false)
      }
    )

  })

  it.only('Unrecognized subscriptionStatus treated as Unsubscribed"', async () => {
    const randomSubscriptionStatusPhrase = 'some-subscription-enum'

    const expectedTwilioRequest = new URLSearchParams({
      Body: 'Hello world, jane!',
      From: 'MG1111222233334444',
      To: '+1234567891',
      ShortenUrls: 'true'
    })

    nock('https://api.twilio.com/2010-04-01/Accounts/a')
      .post('/Messages.json', expectedTwilioRequest.toString())
      .reply(201, {})

    const actionInputData = {
      event: createMessagingTestEvent({
        timestamp,
        event: 'Audience Entered',
        userId: 'jane'
      }),
      settings,
      mapping: getDefaultMapping({
        externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus: randomSubscriptionStatusPhrase }]
      }),
      logger: createLoggerMock()
    }

    const responses = await twilio.testAction('sendSms', actionInputData)
    expect(responses).toHaveLength(0)
    expect(actionInputData.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("TE Messaging: Invalid subscription statuses found in externalIds"),
      expect.anything()
    )
    expect(actionInputData.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("TE Messaging: Not sending message, because sendabilityStatus"),
      expect.anything()
    )
  })
  describe('get profile traits', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('should throw error if unable to request profile traits', async () => {
      // eslint-disable-next-line no-debugger
      const logger = createLoggerMock()

      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(500)

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          traitEnrichment: false
        }),
        logger
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unable to get profile traits for SMS message'
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^TE Messaging: SMS profile traits request failure - ${spaceId}`)),
        expect.anything()
      )
    })

    it('should get profile traits successfully', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: { 'profile.user_id': 'jane' }
        })

      nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping()
      }

      await expect(twilio.testAction('sendSms', actionInputData)).resolves.not.toThrowError()
    })
  })
})
