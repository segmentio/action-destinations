import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { settings, event, timelineEntriesCreateResponse, revUsersListResponse } from '../../mocks'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createRevUser', () => {
  it('makes the correct API calls when there is already a revUser for the email and there is no comment', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query(true).reply(200, revUsersListResponse.data)
    nock('https://api.devrev.ai').get('/timeline-entries.create').reply(200, timelineEntriesCreateResponse.data)
    const response = await testDestination.testAction('createRevUser', { settings, event, useDefaultMappings: true })
    expect(response).toBeTruthy()
  })
})
