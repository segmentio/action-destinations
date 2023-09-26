import destination from '../index'

jest.mock('@segment/actions-core')
jest.mock('../generated-types')
// jest.mock('settings');
// jest.mock('payload');
jest.mock('../receiveEvents/generated-types')
jest.mock('lodash/get')
jest.mock('../receiveEvents/eventprocessing')
// jest.mock('../receiveEvents/eventprocessing/addUpdateEvents');
jest.mock('../../../lib/AWS/s3')
jest.mock('../receiveEvents/preCheck')

describe('destination', () => {
  test('has valid presets', () => {
    expect(destination.presets).toBeDefined()
    expect(destination.presets).toBeInstanceOf(Array)
    expect(destination.presets?.[0]).toHaveProperty('partnerAction')
    expect(destination.presets?.[1]).toHaveProperty('partnerAction')
  })

  test('has valid fields', () => {
    expect(destination.authentication?.fields.fileNamePrefix).toBeDefined()
    expect(destination.authentication?.fields.s3_access_key).toBeDefined()
    expect(destination.authentication?.fields.s3_secret).toBeDefined()
    expect(destination.authentication?.fields.s3_bucket).toBeDefined()
    expect(destination.authentication?.fields.s3_region).toBeDefined()
  })

  test('has valid actions', () => {
    expect(destination.actions).toBeDefined()
    expect(destination.actions).toHaveProperty('receiveEvents')
  })
})
