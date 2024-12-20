import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'

describe('MagellanAI.view', () => {
  it('invokes the correct endpoint', async () => {
    nock('https://mgln.ai').post('/view', { url: 'https://foo.bar/testing.html', token: '123abc' }).reply(200)

    await testDestination.testAction('view', {
      mapping: { url: 'https://foo.bar/testing.html' },
      settings: { pixelToken: pixelToken }
    })
  })

  it(`fails if the url field is missing`, async () => {
    try {
      await testDestination.testAction('view', {
        mapping: {},
        settings: { pixelToken: pixelToken }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'url'.")
    }
  })
})
