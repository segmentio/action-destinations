import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AcousticS3Tc.receiveEvents', () => {
  // TODO: Test your action
  createTestEvent
  testDestination
  nock
})
