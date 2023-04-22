import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Airship.tags', () => {
  console.log(nock)
  console.log(createTestEvent)
  console.log(testDestination)
  // TODO: Test your action
})
