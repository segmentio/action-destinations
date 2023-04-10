import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Airship.setAttributes', () => {
  console.log(nock)
  console.log(createTestEvent)
  console.log(testDestination)
})
