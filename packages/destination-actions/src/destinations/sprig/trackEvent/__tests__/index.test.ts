import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Sprig.trackUser', () => {
  // TODO: Test your action
  createTestEvent
  testDestination
  nock.name
})
