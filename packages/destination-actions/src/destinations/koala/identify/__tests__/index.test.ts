import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Koala.identify', () => {
  it('forwards the segment identify call in the `identifies` field', async () => {
    nock(`https://api2.getkoala.com/web/projects/testId`).post('/batch').reply(204, {})

    const responses = await testDestination.testAction('identify', {
      settings: { public_key: 'testId' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)

    // TODO: test identify mapping
  })
})
