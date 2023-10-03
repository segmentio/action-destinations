import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.trackEvent', () => {
  it('works with default mappings', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      properties: {
        email: 'test@iterable.com'
      }
    })

    nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })

  it('throws an error if `email` or `userId` are not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: null
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('converts a date into a standard Iterable format', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'user1234',
      properties: {
        myDate: '2023-05-17T22:49:53.310Z'
      }
    })

    nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].options.json).toMatchObject({
      userId: 'user1234',
      dataFields: {
        myDate: '2023-05-17 22:49:53 +00:00'
      }
    })
  })

  it('does not convert a non date string into a standard Iterable date format', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'user1234',
      properties: {
        badDate1: '1234',
        badDate2: '1234-12',
        badDate3: '1234-12-00',
        badDate4: '1234-12-99',
        myGoodDate: '2023-05-17T22:49:53.310Z'
      }
    })

    nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].options.json).toMatchObject({
      userId: 'user1234',
      dataFields: {
        badDate1: '1234',
        badDate2: '1234-12',
        badDate3: '1234-12-00',
        badDate4: '1234-12-99',
        myGoodDate: '2023-05-17 22:49:53 +00:00'
      }
    })
  })

  it('should success with mapping of preset and Entity Added event(presets) ', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Entity Added',
      properties: {
        email: 'test@iterable.com'
      }
    })

    nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      // Using the mapping of presets with event type 'track'
      mapping: {
        dataFields: {
          '@path': '$.properties'
        }
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
