import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { settings, event, testEventPayload, partId, assignTo } from '../../mocks/index'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createWork', () => {
  it('makes the correct API call to create a work with default mappings', async () => {
    nock('https://api.devrev.ai')
      .post('/internal/works.create')
      .reply(201, (_, body) => body)
    const mapping = {
      partId,
      assignTo
    }
    const response = await testDestination.testAction('createWork', {
      settings,
      useDefaultMappings: true,
      mapping,
      event
    })

    //Make sure the request body is correct, which is the payload that would be sent to the API
    expect(response).toBeTruthy()
    expect(response[0].data).toEqual({
      applies_to_part: partId,
      title: testEventPayload.event,
      body: testEventPayload.properties?.description,
      owned_by: [assignTo],
      type: 'issue',
      priority: 'p2'
    })
  })
})
