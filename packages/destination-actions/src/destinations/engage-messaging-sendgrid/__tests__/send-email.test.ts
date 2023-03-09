import nock from 'nock'
import { createTestIntegration, omit } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import Sendgrid from '..'

const sendgrid = createTestIntegration(Sendgrid)
const timestamp = new Date().toISOString()

describe.each(['stage', 'production'])('%s environment', (environment) => {
  const settings = {
    unlayerApiKey: 'unlayerApiKey',
    sendGridApiKey: 'sendGridApiKey',
    profileApiEnvironment: environment,
    profileApiAccessToken: 'c',
    spaceId: 'spaceId',
    sourceId: 'sourceId'
  }

  const userData = {
    userId: 'jane',
    firstName: 'First Name',
    lastName: 'Browning',
    phone: '+11235554657',
    email: 'test@example.com'
  }

  const endpoint = `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`

  const sendgridRequestBody = {
    personalizations: [
      {
        to: [
          {
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`
          }
        ],
        bcc: [
          {
            email: 'test@test.com'
          }
        ],
        custom_args: {
          source_id: 'sourceId',
          space_id: 'spaceId',
          user_id: userData.userId,
          __segment_internal_external_id_key__: 'email',
          __segment_internal_external_id_value__: userData.email
        }
      }
    ],
    from: {
      email: 'from@example.com',
      name: 'From Name'
    },
    reply_to: {
      email: 'replyto@example.com',
      name: 'Test user'
    },
    subject: `Hello ${userData.lastName} ${userData.firstName}.`,
    content: [
      {
        type: 'text/html',
        value: `Hi ${userData.firstName}, Welcome to segment`
      }
    ],
    tracking_settings: {
      subscription_tracking: {
        enable: true,
        substitution_tag: '[unsubscribe]'
      }
    }
  }

  const getDefaultMapping = (overrides?: any) => {
    return {
      userId: { '@path': '$.userId' },
      fromDomain: null,
      fromEmail: 'from@example.com',
      fromName: 'From Name',
      replyToEmail: 'replyto@example.com',
      replyToName: 'Test user',
      bcc: JSON.stringify([
        {
          email: 'test@test.com'
        }
      ]),
      previewText: '',
      subject: 'Hello {{profile.traits.lastName}} {{profile.traits.firstName}}.',
      body: 'Hi {{profile.traits.firstName}}, Welcome to segment',
      bodyType: 'html',
      bodyHtml: 'Hi {{profile.traits.firstName}}, Welcome to segment',
      send: true,
      traitEnrichment: true,
      groupId: '',
      toEmail: '',
      externalIds: {
        '@arrayPath': [
          '$.external_ids',
          {
            id: {
              '@path': '$.id'
            },
            type: {
              '@path': '$.type'
            },
            subscriptionStatus: {
              '@path': '$.isSubscribed'
            },
            groups: {
              '@path': '$.groups'
            }
          }
        ]
      },
      traits: { '@path': '$.properties' },
      eventOccurredTS: { '@path': '$.timestamp' },
      ...overrides
    }
  }

  describe(`send Email`, () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:${userData.userId}`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: {
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should send Email', async () => {
      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send', sendgridRequestBody).reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email'
            }
          ]
        }),
        settings,
        mapping: getDefaultMapping()
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
    })

    it('should not send email when send = false', async () => {
      const mapping = getDefaultMapping({
        groupId: 'any_group',
        send: false
      })
      await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId
        }),
        settings,
        mapping: mapping
      })
      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send', sendgridRequestBody).reply(200, {})

      expect(sendGridRequest.isDone()).toEqual(false)
    })
    it('should throw error and not send email with no trait enrichment and no user id', async () => {
      const mapping = getDefaultMapping({
        userId: undefined,
        traitEnrichment: false
      })
      await expect(
        sendgrid.testAction('sendEmail', {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: undefined
          }),
          settings,
          mapping
        })
      ).rejects.toThrow('Unable to process email, no userId provided and trait enrichment disabled')

      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send', sendgridRequestBody).reply(200, {})
      expect(sendGridRequest.isDone()).toEqual(false)
    })

    it('should not send an email when send field not in payload', async () => {
      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId
        }),
        settings,
        mapping: omit(getDefaultMapping(), ['send'])
      })
      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send', sendgridRequestBody).reply(200, {})

      expect(responses.length).toEqual(0)
      expect(sendGridRequest.isDone()).toEqual(false)
    })

    it('should send email with journey metadata', async () => {
      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`
              }
            ],
            bcc: [
              {
                email: 'test@test.com'
              }
            ],
            custom_args: {
              source_id: 'sourceId',
              space_id: 'spaceId',
              user_id: userData.userId,
              journey_id: 'journeyId',
              journey_state_id: 'journeyStateId',
              audience_id: 'audienceId',
              __segment_internal_external_id_key__: 'email',
              __segment_internal_external_id_value__: userData.email
            }
          }
        ],
        from: {
          email: 'from@example.com',
          name: 'From Name'
        },
        reply_to: {
          email: 'replyto@example.com',
          name: 'Test user'
        },
        subject: 'Test email with metadata',
        content: [
          {
            type: 'text/html',
            value: 'Welcome to segment'
          }
        ],
        tracking_settings: {
          subscription_tracking: {
            enable: true,
            substitution_tag: '[unsubscribe]'
          }
        }
      }

      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', expectedSendGridRequest)
        .reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromDomain: null,
          fromEmail: 'from@example.com',
          fromName: 'From Name',
          replyToEmail: 'replyto@example.com',
          replyToName: 'Test user',
          bcc: JSON.stringify([
            {
              email: 'test@test.com'
            }
          ]),
          customArgs: {
            journey_id: 'journeyId',
            journey_state_id: 'journeyStateId',
            audience_id: 'audienceId'
          },
          previewText: 'unused',
          subject: 'Test email with metadata',
          body: 'Welcome to segment',
          bodyType: 'html',
          bodyHtml: 'Welcome to segment',
          send: true,
          traitEnrichment: true,
          externalIds: [
            { id: userData.email, type: 'email', subscriptionStatus: 'subscribed' },
            { id: userData.phone, type: 'phone', subscriptionStatus: 'subscribed' }
          ],
          traits: { '@path': '$.properties' },
          eventOccurredTS: { '@path': '$.timestamp' }
        }
      })

      expect(responses.map((r) => r.url)).toStrictEqual([`https://api.sendgrid.com/v3/mail/send`])
      expect(sendGridRequest.isDone()).toEqual(true)
    })

    it.each(['gmailx.com', 'yahoox.com', 'aolx.com', 'hotmailx.com'])(
      `should return an error when given a restricted domain "%s"`,
      async (domain) => {
        try {
          await sendgrid.testAction('sendEmail', {
            event: createMessagingTestEvent({
              timestamp,
              event: 'Audience Entered',
              userId: userData.userId
            }),
            settings,
            mapping: getDefaultMapping({ toEmail: `lauren@${domain}` })
          })
          fail('Test should throw an error')
        } catch (e) {
          expect((e as unknown as any).message).toBe(
            'Emails with gmailx.com, yahoox.com, aolx.com, and hotmailx.com domains are blocked.'
          )
        }
      }
    )

    it('should send email where HTML body is stored in S3', async () => {
      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`
              }
            ],
            bcc: [
              {
                email: 'test@test.com'
              }
            ],
            custom_args: {
              source_id: 'sourceId',
              space_id: 'spaceId',
              user_id: userData.userId,
              __segment_internal_external_id_key__: 'email',
              __segment_internal_external_id_value__: userData.email
            }
          }
        ],
        from: {
          email: 'from@example.com',
          name: 'From Name'
        },
        reply_to: {
          email: 'replyto@example.com',
          name: 'Test user'
        },
        subject: `Hello ${userData.lastName} ${userData.firstName}.`,
        content: [
          {
            type: 'text/html',
            value: `Hi ${userData.firstName}, welcome to Segment`
          }
        ],
        tracking_settings: {
          subscription_tracking: {
            enable: true,
            substitution_tag: '[unsubscribe]'
          }
        }
      }

      const s3Request = nock('https://s3.com')
        .get('/body.txt')
        .reply(200, 'Hi {{profile.traits.firstName}}, welcome to Segment')

      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', expectedSendGridRequest)
        .reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email'
            }
          ]
        }),
        settings,
        mapping: getDefaultMapping({
          body: undefined,
          bodyUrl: 'https://s3.com/body.txt',
          bodyHtml: undefined
        })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
      expect(s3Request.isDone()).toEqual(true)
    })

    it('should send email where Unlayer body is stored in S3', async () => {
      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`
              }
            ],
            bcc: [
              {
                email: 'test@test.com'
              }
            ],
            custom_args: {
              source_id: 'sourceId',
              space_id: 'spaceId',
              user_id: userData.userId,
              __segment_internal_external_id_key__: 'email',
              __segment_internal_external_id_value__: userData.email
            }
          }
        ],
        from: {
          email: 'from@example.com',
          name: 'From Name'
        },
        reply_to: {
          email: 'replyto@example.com',
          name: 'Test user'
        },
        subject: `Hello ${userData.lastName} ${userData.firstName}.`,
        content: [
          {
            type: 'text/html',
            value: `<h1>Hi ${userData.firstName}, welcome to Segment</h1>`
          }
        ],
        tracking_settings: {
          subscription_tracking: {
            enable: true,
            substitution_tag: '[unsubscribe]'
          }
        }
      }

      const s3Request = nock('https://s3.com').get('/body.txt').reply(200, '{"unlayer":true}')

      const unlayerRequest = nock('https://api.unlayer.com')
        .post('/v2/export/html', {
          displayMode: 'email',
          design: {
            unlayer: true
          }
        })
        .reply(200, {
          data: {
            html: '<h1>Hi {{profile.traits.firstName}}, welcome to Segment</h1>'
          }
        })

      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', expectedSendGridRequest)
        .reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email'
            }
          ]
        }),
        settings,
        mapping: getDefaultMapping({
          body: undefined,
          bodyUrl: 'https://s3.com/body.txt',
          bodyHtml: undefined,
          bodyType: 'design'
        })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
      expect(s3Request.isDone()).toEqual(true)
      expect(unlayerRequest.isDone()).toEqual(true)
    })

    it('inserts preview text', async () => {
      const bodyHtml = '<p>Hi First Name, welcome to Segment</p>'

      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`
              }
            ],
            bcc: [
              {
                email: 'test@test.com'
              }
            ],
            custom_args: {
              source_id: 'sourceId',
              space_id: 'spaceId',
              user_id: userData.userId,
              __segment_internal_external_id_key__: 'email',
              __segment_internal_external_id_value__: userData.email
            }
          }
        ],
        from: {
          email: 'from@example.com',
          name: 'From Name'
        },
        reply_to: {
          email: 'replyto@example.com',
          name: 'Test user'
        },
        subject: `Hello ${userData.lastName} ${userData.firstName}.`,
        content: [
          {
            type: 'text/html',
            value: [
              '<html><head></head><body>',
              '    <div style="display: none; max-height: 0px; overflow: hidden;">',
              '      Preview text customer',
              '    </div>',
              '',
              '    <div style="display: none; max-height: 0px; overflow: hidden;">',
              '      &nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;',
              '    </div>',
              '  ',
              bodyHtml,
              '</body></html>'
            ].join('\n')
          }
        ],
        tracking_settings: {
          subscription_tracking: {
            enable: true,
            substitution_tag: '[unsubscribe]'
          }
        }
      }

      const s3Request = nock('https://s3.com').get('/body.txt').reply(200, '{"unlayer":true}')

      const unlayerRequest = nock('https://api.unlayer.com')
        .post('/v2/export/html', {
          displayMode: 'email',
          design: {
            unlayer: true
          }
        })
        .reply(200, {
          data: {
            html: ['<html><head></head><body>', bodyHtml, '</body></html>'].join('\n')
          }
        })

      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', expectedSendGridRequest)
        .reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email'
            }
          ]
        }),
        settings,
        mapping: getDefaultMapping({
          previewText: 'Preview text {{profile.traits.first_name | default: "customer"}}',
          body: undefined,
          bodyUrl: 'https://s3.com/body.txt',
          bodyHtml: undefined,
          bodyType: 'design'
        })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
      expect(s3Request.isDone()).toEqual(true)
      expect(unlayerRequest.isDone()).toEqual(true)
    })

    it('should show a default in the subject when a trait is missing', async () => {
      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', { ...sendgridRequestBody, subject: `Hello you` })
        .reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email'
            }
          ]
        }),
        settings,
        mapping: getDefaultMapping({
          subject: 'Hello {{profile.traits.last_name | default: "you"}}'
        })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
    })

    it('should show a default in the body when a trait is missing', async () => {
      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', {
          ...sendgridRequestBody,
          content: [
            {
              type: 'text/html',
              value: `Hi you, Welcome to segment`
            }
          ]
        })
        .reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email'
            }
          ]
        }),
        settings,
        mapping: getDefaultMapping({
          bodyHtml: 'Hi {{profile.traits.first_name | default: "you"}}, Welcome to segment'
        })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
    })
  })

  describe('send Email subscription handling', () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:${userData.userId}`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: {
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('sends the email when subscriptionStatus is true', async () => {
      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send').reply(200, {})

      const isSubscribed = true
      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            { id: userData.email, type: 'email', isSubscribed, collection: 'users', encoding: 'none' },
            { id: userData.phone, type: 'phone', isSubscribed: true, collection: 'users', encoding: 'none' }
          ]
        }),
        settings,
        mapping: getDefaultMapping()
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
    })

    it.each([null, false])(
      'does NOT send the email when subscriptionStatus = "%s"',
      async (isSubscribed: boolean | null) => {
        await sendgrid.testAction('sendEmail', {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: userData.userId,
            external_ids: [
              { id: userData.email, type: 'email', isSubscribed, collection: 'users', encoding: 'none' },
              { id: userData.phone, type: 'phone', isSubscribed: true, collection: 'users', encoding: 'none' }
            ]
          }),
          settings,
          mapping: getDefaultMapping()
        })
        const sendGridRequest = nock('https://api.sendgrid.com')
          .post('/v3/mail/send', sendgridRequestBody)
          .reply(200, {})

        expect(sendGridRequest.isDone()).toBe(false)
      }
    )
  })

  describe('subscription groups', () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:${userData.userId}`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: {
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should send email to group', async () => {
      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send').reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              id: userData.email,
              type: 'email',
              isSubscribed: true,
              collection: 'users',
              encoding: 'none',
              groups: [{ id: 'grp_1', isSubscribed: true }]
            }
          ]
        }),
        settings: {
          ...settings
        },
        mapping: getDefaultMapping({ groupId: 'grp_1' })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
    })

    it('should send email to group when group id is empty string', async () => {
      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send').reply(200, {})

      const responses = await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              id: userData.email,
              type: 'email',
              isSubscribed: true,
              collection: 'users',
              encoding: 'none',
              groups: [{ id: 'grp_1', isSubscribed: true }]
            }
          ]
        }),
        settings: {
          ...settings
        },
        mapping: getDefaultMapping({ groupId: '', toEmail: 'asdad@asd.com' })
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(sendGridRequest.isDone()).toEqual(true)
    })

    it.each([null, false])(
      'does NOT send the email to group when group\'s subscriptionStatus = "%s"',
      async (isSubscribed: boolean | null) => {
        await sendgrid.testAction('sendEmail', {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: userData.userId,
            external_ids: [
              {
                id: userData.email,
                type: 'email',
                isSubscribed: true,
                collection: 'users',
                encoding: 'none',
                groups: [{ id: 'grp_1', isSubscribed }]
              },
              { id: userData.phone, type: 'phone', isSubscribed: true, collection: 'users', encoding: 'none' }
            ]
          }),
          settings: {
            ...settings
          },
          mapping: getDefaultMapping({ groupId: 'grp_1' })
        })
        const sendGridRequest = nock('https://api.sendgrid.com')
          .post('/v3/mail/send', sendgridRequestBody)
          .reply(200, {})

        expect(sendGridRequest.isDone()).toBe(false)
      }
    )

    it('does NOT send email to group when groupId is not in groups', async () => {
      await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: [
            {
              collection: 'users',
              encoding: 'none',
              id: userData.email,
              isSubscribed: true,
              type: 'email',
              groups: [
                {
                  id: 'grp_1',
                  isSubscribed: true
                }
              ]
            }
          ]
        }),
        settings: {
          ...settings
        },
        mapping: getDefaultMapping({ groupId: 'grp_2' })
      })

      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send', sendgridRequestBody).reply(200, {})

      expect(sendGridRequest.isDone()).toBe(false)
    })

    it('does NOT send email to group when external ids are not present', async () => {
      await sendgrid.testAction('sendEmail', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId,
          external_ids: undefined
        }),
        settings: {
          ...settings
        },
        mapping: getDefaultMapping({ groupId: 'grp_2' })
      })

      const sendGridRequest = nock('https://api.sendgrid.com').post('/v3/mail/send', sendgridRequestBody).reply(200, {})

      expect(sendGridRequest.isDone()).toBe(false)
    })
  })
})
