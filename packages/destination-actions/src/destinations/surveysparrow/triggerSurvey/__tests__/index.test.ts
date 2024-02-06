import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

const defaultMapping = {
  id: {
    '@path': '$.properties.channel_id'
  },
  survey_id: {
    '@path': '$.properties.survey_id'
  },
  email: {
    '@path': '$.properties.email'
  },
  mobile: {
    '@path': '$.properties.mobile'
  },
  share_type: {
    '@path': '$.properties.share_type'
  }
}

const endpoint = 'https://api.surveysparrow.com'
const channelId = 1

describe('Surveysparrow.triggerSurvey', () => {
  it('should trigger a email survey with valid payload', async () => {
    nock(endpoint).put(`/v3/channels/${channelId}`).reply(200, { success: true })

    const event = createTestEvent({
      properties: {
        channel_id: channelId,
        survey_id: 1,
        email: 'jhdfgjewh@hgjsd.com',
        share_type: 'Email'
      }
    })

    const responses = await testDestination.testAction('triggerSurvey', {
      event,
      mapping: defaultMapping,
      settings: {
        apiToken: 'test-source-write-key'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
  })

  it('should trigger a sms survey with valid payload', async () => {
    nock(endpoint).put(`/v3/channels/${channelId}`).reply(200, { success: true })

    const event = createTestEvent({
      properties: {
        channel_id: channelId,
        survey_id: 1,
        mobile: '+919876543210',
        share_type: 'SMS'
      }
    })

    const responses = await testDestination.testAction('triggerSurvey', {
      event,
      mapping: defaultMapping,
      settings: {
        apiToken: 'test-source-write-key'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
  })

  it('should throw errors when triggering a survey', async () => {
    nock(endpoint).put(`/v3/channels/${channelId}`).reply(400, { success: false })

    const event = createTestEvent({
      properties: {
        channel_id: channelId,
        survey_id: 1,
        email: 'hi-up@mail.com'
      }
    })

    await testDestination
      .testAction('triggerSurvey', {
        event,
        mapping: defaultMapping,
        settings: {
          apiToken: 'test-source-write-key'
        }
      })
      .catch((error) => {
        expect(error.message).toEqual("The root value is missing the required field 'share_type'.")
      })
  })

  it('should throw errors when triggering a SMS survey', async () => {
    nock(endpoint).put(`/v3/channels/${channelId}`).reply(400, { success: false })

    const event = createTestEvent({
      properties: {
        channel_id: channelId,
        survey_id: 1,
        email: 'hi-up@mail.com',
        share_type: 'SMS'
      }
    })

    await testDestination
      .testAction('triggerSurvey', {
        event,
        mapping: defaultMapping,
        settings: {
          apiToken: 'test-source-write-key'
        }
      })
      .catch((error) => {
        expect(error.message).toEqual('Mobile is a Required Field for SMS Shares')
      })
  })
})
