import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendCallCompleted'
const destinationSlug = 'actions-voiceops'
const seedName = `${destinationSlug}#${actionSlug}`
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeWarmTransferFields(eventData: Record<string, unknown>) {
  const normalizedChannels = Array.isArray(eventData.channels)
    ? eventData.channels.map((channel) => {
        if (!channel || typeof channel !== 'object') {
          return channel
        }

        const typedChannel = channel as Record<string, unknown>
        const identifier = typeof typedChannel.identifier === 'string' ? typedChannel.identifier : ''

        if (typedChannel.type === 'HANDLING_AGENT' && !EMAIL_REGEX.test(identifier)) {
          return {
            ...typedChannel,
            identifier: 'agent@example.com'
          }
        }

        if (!identifier.trim()) {
          return {
            ...typedChannel,
            identifier: 'participant-1'
          }
        }

        return typedChannel
      })
    : eventData.channels

  const normalizedAgentLegs = Array.isArray(eventData.agentLegs)
    ? eventData.agentLegs.map((agentLeg) => {
        if (!agentLeg || typeof agentLeg !== 'object') {
          return agentLeg
        }

        const typedAgentLeg = agentLeg as Record<string, unknown>

        return {
          ...typedAgentLeg,
          first_name:
            typeof typedAgentLeg.first_name === 'string' && typedAgentLeg.first_name.trim()
              ? typedAgentLeg.first_name
              : 'Agent',
          last_name:
            typeof typedAgentLeg.last_name === 'string' && typedAgentLeg.last_name.trim()
              ? typedAgentLeg.last_name
              : 'Example'
        }
      })
    : eventData.agentLegs

  if (eventData.channels && eventData.agentLegs) {
    return {
      ...eventData,
      call_started_at: '1712683200',
      channels: normalizedChannels,
      agentLegs: undefined
    }
  }

  return {
    ...eventData,
    call_started_at: '1712683200',
    channels: normalizedChannels,
    agentLegs: normalizedAgentLegs
  }
}

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      event: 'Call Completed',
      properties: {
        ...normalizeWarmTransferFields(eventData as Record<string, unknown>),
        recording_url: 'https://example.com/audio.wav'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      event: 'Call Completed',
      properties: {
        ...normalizeWarmTransferFields(eventData as Record<string, unknown>),
        recording_url: 'https://example.com/audio.wav'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })
})
