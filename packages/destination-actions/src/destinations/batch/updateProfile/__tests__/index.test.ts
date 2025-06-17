// import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const settings = {
  apiToken: '<REST_API_KEY>', // = REST API Key
  projectKey: '<PROJECT_KEY>',
  endpoint: 'https://api.batch.com/2.3/profiles/update' as const
}

const testDestination = createTestIntegration(Destination)

describe('Batch.updateProfile', () => {
  // TODO: Test my action
  it('should process required fields correctly', async () => {
    const action = Destination.actions.updateProfile

    const eventData = {
      receivedAt: '2025-01-02T14:18:45.187Z',
      timestamp: '2025-01-02T14:18:42.235Z',
      properties: {
        id: 39792,
        email: 'antoine39792@hotmail.com',
        firstName: 'Test',
        lastName: 'User',
        birthday: '2024-06-06T18:13:48+02:00'
      },
      context: {
        library: {
          name: 'unknown',
          version: 'unknown'
        }
      },
      type: 'identify',
      userId: '8de68ddc-22ab-4c1e-a50b-dd6f3a63da06',
      originalTimestamp: '2025-01-02T14:18:42.235Z',
      messageId: 'api-2r4o5eBJElExhnmTMqEg3OAEL7H',
      integrations: {}
    }

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(action.slug, {
      event: event,
      mapping: event.properties,
      settings: settings,
      auth: undefined
    })
    console.log('testAction : ' + testDestination.testAction)

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot() // Comparaison avec un snapshot
    } catch (err) {
      expect(rawBody).toMatchSnapshot() // Si erreur dans la conversion JSON, vérifier le rawBody
    }

    expect(request.headers).toMatchSnapshot() // Comparer les en-têtes de la requête
  })
})
