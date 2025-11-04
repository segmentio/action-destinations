import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Slack from '../index'

const testDestination = createTestIntegration(Slack)
const timestamp = '2021-08-17T15:21:15.449Z'

const url = `https://hooks.slack.com/services/${'T00000000'}/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

const mapping = {
  url,
  text: 'test',
  channel: 'general'
}

describe('Slack', () => {
  describe('postToChannel', () => {
    it('should work with default mappings', async () => {
      const event = createTestEvent({ timestamp, event: 'Test Event' })

      nock('https://hooks.slack.com/')
        .post(`/services/${'T00000000'}/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)
        .reply(200, {})

      const responses = await testDestination.testAction('postToChannel', { useDefaultMappings: true, event, mapping })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        icon_url: 'https://cdn.brandfetch.io/segment.com/lettermark?c=1idN1Q_QikZtdcPcryr',
        text: 'test',
        username: 'Segment',
        channel: 'general'
      })
    })
    it('should validate user settings', async () => {
      const event = createTestEvent({ timestamp, event: 'Test Event' })
      const badMapping = {
        url: `https://hooks.slack.com/services/${'T00000000'}/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX?bad=true`,
        text: 'test',
        channel: 'general'
      }
      nock('https://hooks.slack.com/')
        .post(`/services/${'T00000000'}/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)
        .reply(200, {})

      try {
        await testDestination.testAction('postToChannel', {
          useDefaultMappings: true,
          event,
          mapping: badMapping
        })
      } catch (e) {
        const err = e as IntegrationError
        expect(err.message).toBe('Invalid Slack URL')
        expect(err.code).toBe('Bad Request')
        expect(err.status).toBe(400)
      }
    })
  })
})
