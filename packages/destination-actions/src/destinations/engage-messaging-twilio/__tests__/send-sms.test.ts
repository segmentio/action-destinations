import nock from 'nock'
import { createTestAction, loggerMock as logger } from './__helpers__/test-utils'
import { FLAGON_NAME_LOG_ERROR, FLAGON_NAME_LOG_INFO } from '../utils/message-sender'

describe.each(['stage', 'production'])('%s environment', (environment) => {
  const contentSid = 'g'
  const spaceId = 'd'
  const testAction = createTestAction({
    action: 'sendSms',
    environment,
    spaceId,
    getMapping: () => ({
      userId: { '@path': '$.userId' },
      from: 'MG1111222233334444',
      body: 'Hello world, {{profile.user_id}}!',
      send: true,
      traitEnrichment: true,
      externalIds: [
        { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
        { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed', channelType: 'sms' }
      ]
    })
  })

  const topLevelName = environment === 'production' ? 'com' : 'build'
  const endpoint = `https://profiles.segment.${topLevelName}`
  beforeEach(() => {
    nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
      traits: {}
    })
  })

  describe('send SMS', () => {
    it('should abort when there is no `phone` external ID in the payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' }]
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should throw error with no userId and no trait enrichment', async () => {
      await expect(
        testAction({
          mappingOverrides: {
            userId: undefined,
            traitEnrichment: false
          }
        })
      ).rejects.toThrowError('Unable to process sms, no userId provided and no traits provided')
      expect(logger.error).toHaveBeenCalledWith(
        `TE Messaging: SMS Unable to process, no userId provided and no traits provided - ${spaceId}`,
        expect.anything()
      )
    })

    it('should throw error if unable to parse liquid template', async () => {
      await expect(
        testAction({
          mappingOverrides: {
            body: 'Hello world, {{profile.user_id$}}!!'
          }
        })
      ).rejects.toThrowError('Unable to parse templating in sms')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^TE Messaging: SMS unable to parse templating - ${spaceId}`)),
        expect.anything()
      )
    })

    it('should thow error if no body provided and no contentSid provided', async () => {
      await expect(testAction({ mappingOmitKeys: ['body'] })).rejects.toThrowError(
        'Unable to process sms, no body provided and no content sid provided'
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`^TE Messaging: SMS unable to process, no body provided and no content sid provided - ${spaceId}`)
        ),
        expect.anything()
      )
    })

    it.each(['twilio/call-to-action', 'twilio/card', 'twilio/quick-reply', 'twilio/list-picker'])(
      'should throw error if template content type is not "twilio/text" or "twilio/media"',
      async (contentType) => {
        const twilioContentResponse = {
          types: {
            [contentType]: {
              body: 'Hello world, {{profile.user_id}}!'
            }
          }
        }

        nock('https://content.twilio.com').get(`/v1/Content/${contentSid}`).reply(200, twilioContentResponse)

        await expect(
          testAction({
            mappingOverrides: {
              contentSid
            },
            mappingOmitKeys: ['body']
          })
        ).rejects.toThrowError(`Sending templates with '${contentType}' content type is not supported by sms`)
        expect(logger.error).toHaveBeenCalledWith(
          `TE Messaging: SMS unsupported content template type '${contentType}' - ${spaceId}`,
          expect.anything()
        )
      }
    )

    it('should throw error if template does not include a "types" key', async () => {
      const twilioContentResponse = {
        langugage: 'en',
        friendly_name: 'my_template',
        sid: contentSid
      }

      nock('https://content.twilio.com').get(`/v1/Content/${contentSid}`).reply(200, twilioContentResponse)

      await expect(
        testAction({
          mappingOverrides: {
            contentSid
          },
          mappingOmitKeys: ['body']
        })
      ).rejects.toThrowError('Template from Twilio Content API does not contain any template types')
      expect(logger.error).toHaveBeenCalledWith(
        `TE Messaging: SMS template from Twilio Content API does not contain a template type - ${spaceId} - [${JSON.stringify(
          twilioContentResponse
        )}]`,
        expect.anything()
      )
    })

    it('should throw error if Twilio Content API request fails', async () => {
      const expectedErrorResponse = {
        code: 20404,
        message: 'The requested resource was not found',
        more_info: 'https://www.twilio.com/docs/errors/20404',
        status: 404
      }

      nock('https://content.twilio.com').get(`/v1/Content/${contentSid}`).reply(404, expectedErrorResponse)

      await expect(
        testAction({
          mappingOverrides: {
            contentSid
          },
          mappingOmitKeys: ['body']
        })
      ).rejects.toThrowError('Unable to fetch content template')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`^TE Messaging: SMS failed request to fetch content template from Twilio Content API - ${spaceId}`)
        ),
        expect.anything()
      )
    })

    it('should throw error if Twilio Programmable Messaging API request fails', async () => {
      const expectedErrorResponse = {
        code: 21211,
        message: "The 'To' number is not a valid phone number.",
        more_info: 'https://www.twilio.com/docs/errors/21211',
        status: 400
      }

      nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(400, expectedErrorResponse)

      await expect(testAction()).rejects.toThrowError()
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^TE Messaging: SMS Twilio Programmable API error - ${spaceId}`)),
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

      const responses = await testAction()
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

      await testAction({
        mappingOverrides: {
          contentSid
        },
        mappingOmitKeys: ['body']
      })
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

      const responses = await testAction({
        mappingOverrides: {
          media: ['http://myimg.com']
        }
      })
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

      const responses = await testAction({
        mappingOverrides: {
          contentSid
        },
        mappingOmitKeys: ['body']
      })
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

      const responses = await testAction({ settingsOverrides: { twilioHostname } })
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

      const responses = await testAction({
        mappingOverrides: { customArgs: { foo: 'bar' } },
        settingsOverrides: {
          webhookUrl: 'http://localhost',
          connectionOverrides: 'rp=all&rc=5'
        }
      })

      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should fail on invalid webhook url', async () => {
      await expect(
        testAction({
          mappingOverrides: { customArgs: { foo: 'bar' } },
          settingsOverrides: {
            webhookUrl: 'foo'
          }
        })
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`TE Messaging: SMS invalid webhook url`),
        expect.any(String)
      )
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

      const responses = await testAction({
        mappingOverrides: { traitEnrichment: false },
        settingsOverrides: {
          region
        }
      })

      expect(responses.map((response) => response.url)).toStrictEqual([
        `${profileApiEndpoint}/traits?limit=200`,
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toBe(true)
      expect(profilesApiMock.isDone()).toBe(true)
    })
  })

  describe('subscription handling', () => {
    it.each(['subscribed', true])('sends an SMS when subscriptonStatus ="%s"', async (subscriptionStatus) => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        ShortenUrls: 'true'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'sms' }]
        }
      })
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

        const responses = await testAction({
          mappingOverrides: {
            externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'sms' }]
          }
        })
        expect(responses).toHaveLength(0)
        expect(twilioRequest.isDone()).toEqual(false)
      }
    )
  })

  it('Unrecognized subscriptionStatus treated as Unsubscribed"', async () => {
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

    const responses = await testAction({
      mappingOverrides: {
        externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus: randomSubscriptionStatusPhrase }]
      }
    })
    expect(responses).toHaveLength(0)
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('TE Messaging: SMS Invalid subscription statuses found in externalIds'),
      expect.anything()
    )
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('TE Messaging: SMS Not sending message, because sendabilityStatus'),
      expect.anything()
    )
  })

  describe('get profile traits', () => {
    it('should throw error if unable to request profile traits', async () => {
      nock.cleanAll() // cleaning default behavior defined in beforeEach
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(500)

      await expect(
        testAction({
          mappingOverrides: {
            traitEnrichment: false
          }
        })
      ).rejects.toThrowError('Unable to get profile traits for SMS message')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^TE Messaging: SMS profile traits request failure - ${spaceId}`)),
        expect.anything()
      )
    })

    it('should get profile traits successfully', async () => {
      nock.cleanAll() // cleaning default behavior defined in beforeEach
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: { 'profile.user_id': 'jane' }
        })

      nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(201, {})

      await expect(testAction()).resolves.not.toThrowError()
    })
  })

  describe('logging feature flag', () => {
    describe.each(
      //<[logInfo:boolean, logError: boolean][]>
      [
        [false, false],
        [true, false],
        [false, true],
        [true, true],
        [undefined, undefined] // => features = undefined, should be equivalent to [false, false]
      ]
    )('logInfo: %s, logError: %s', (logInfo, logError) => {
      it('logging properly when there is error', async () => {
        expect(logger.error).not.toHaveBeenCalled()
        expect(logger.info).not.toHaveBeenCalled()

        const features =
          typeof logError === 'undefined' && typeof logInfo === 'undefined'
            ? undefined
            : { [FLAGON_NAME_LOG_INFO]: logInfo, [FLAGON_NAME_LOG_ERROR]: logError }
        await expect(
          testAction({
            mappingOverrides: { customArgs: { foo: 'bar' } },
            settingsOverrides: {
              webhookUrl: 'foo'
            },
            features
          })
        ).rejects.toThrowError()

        if (logError) expect(logger.error).toHaveBeenCalled()
        else expect(logger.error).not.toHaveBeenCalled()

        if (logInfo) expect(logger.info).toHaveBeenCalled()
        else expect(logger.info).not.toHaveBeenCalled()
      })

      it('logging properly when there was NO error', async () => {
        expect(logger.error).not.toHaveBeenCalled()
        expect(logger.info).not.toHaveBeenCalled()

        const features =
          typeof logError === 'undefined' && typeof logInfo === 'undefined'
            ? undefined
            : { [FLAGON_NAME_LOG_INFO]: logInfo, [FLAGON_NAME_LOG_ERROR]: logError }

        const expectedTwilioRequest = new URLSearchParams({
          Body: 'Hello world, jane!',
          From: 'MG1111222233334444',
          To: '+1234567891',
          ShortenUrls: 'true'
        })

        const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
          .post('/Messages.json', expectedTwilioRequest.toString())
          .reply(201, {})

        const responses = await testAction({ features })
        expect(responses.length).toBeGreaterThan(0)
        expect(twilioRequest.isDone()).toEqual(true)

        expect(responses.length).toBeGreaterThan(0)

        expect(logger.error).not.toHaveBeenCalled()
        if (logInfo) expect(logger.info).toHaveBeenCalled()
        else expect(logger.info).not.toHaveBeenCalled()
      })
    })
  })
})
