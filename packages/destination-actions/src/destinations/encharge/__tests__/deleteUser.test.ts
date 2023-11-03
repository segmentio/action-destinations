import nock from 'nock'
import { createTestIntegration, DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'
import { enchargeRestAPIBase } from '../utils'

const testDestination = createTestIntegration(Definition)

describe('Encharge Delete user', () => {
  it('should delete by user ID', async () => {
    nock(enchargeRestAPIBase).delete('/v1/people?people[0][userId]=123').reply(200, {})

    const response = await testDestination.onDelete?.({ type: 'track', userId: '123' }, { apiKey: 'foo' })
    const resp = response as DecoratedResponse
    expect(resp.status).toBe(200)
    expect(resp.data).toMatchObject({})
  })

  it('should delete by anonymouse user ID', async () => {
    nock(enchargeRestAPIBase).delete('/v1/people?people[0][segmentAnonymousId]=anon').reply(200, {})

    const response = await testDestination.onDelete?.({ type: 'track', anonymousId: 'anon' }, { apiKey: 'foo' })
    const resp = response as DecoratedResponse
    expect(resp.status).toBe(200)
    expect(resp.data).toMatchObject({})
  })

  it('should not delete if no IDs', async () => {
    const response = await testDestination.onDelete?.({ type: 'track' }, { apiKey: 'foo' })
    expect(response).toEqual(true)
  })
})
