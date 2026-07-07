import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('Quora Conversions API', () => {
  describe('testAuthentication', () => {
    it('passes when api_token and a numeric account_id are provided', async () => {
      await expect(
        testDestination.testAuthentication({ api_token: 'tok', account_id: '527745581653587' })
      ).resolves.not.toThrow()
    })

    it('fails when the api_token is missing', async () => {
      await expect(testDestination.testAuthentication({ api_token: '', account_id: '123' })).rejects.toThrow()
    })

    it('fails when the account_id is not numeric', async () => {
      await expect(
        testDestination.testAuthentication({ api_token: 'tok', account_id: 'not-a-number' })
      ).rejects.toThrow()
    })
  })

  it('has 8 presets all targeting trackConversion', () => {
    expect(Destination.presets).toHaveLength(8)
    for (const preset of Destination.presets ?? []) {
      expect(preset.partnerAction).toBe('trackConversion')
    }
  })
})
