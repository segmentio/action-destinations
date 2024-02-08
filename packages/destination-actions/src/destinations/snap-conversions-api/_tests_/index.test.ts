import { capiV2tests } from './capiV2tests'
import { capiV3tests } from './capiV3tests'
import nock from 'nock'

beforeEach(() => {
  nock.cleanAll() // Clear all Nock interceptors and filters
})

describe('Snap Conversions API ', () => {
  describe('ReportConversionEvent', () => {
    capiV2tests()
    capiV3tests()
  })
})
