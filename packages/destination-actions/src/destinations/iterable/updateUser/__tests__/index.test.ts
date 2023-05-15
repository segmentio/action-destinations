import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.updateUser', () => {
  it('works with default mappings', async () => {
    const event = createTestEvent()

    nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

    const responses = await testDestination.testAction('updateUser', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('throws an error if `email` or `userId` are not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        firstName: 'Johnny',
        lastName: 'Depp'
      }
    })

    await expect(
      testDestination.testAction('updateUser', {
        event
      })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('maps phone to phoneNumber in dataFields', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user1234',
      traits: {
        phone: '+14158675309'
      }
    })

    nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

    const responses = await testDestination.testAction('updateUser', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].options.json).toMatchObject({
      userId: 'user1234',
      dataFields: {
        phoneNumber: '+14158675309'
      }
    })
  })
})
