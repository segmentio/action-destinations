// import { IntegrationError } from '@segment/actions-core'
// import { Settings } from '../../generated-types'
import { validateSettings } from '../preCheck'

jest.mock('@segment/actions-core')
jest.mock('../generated-types')

describe('validateSettings', () => {
  it('should expose a function', () => {
    expect(validateSettings).toBeDefined()
  })

  it('validateSettings should return expected output', () => {
    // const retValue = validateSettings(settings);
    expect(false).toBeTruthy()
  })
})
