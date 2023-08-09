import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AcousticS3TC.acousticS3TC', () => {
  // TODO: Test your action

  testDestination
  nock.cleanAll
  const c = createTestEvent.length
  c.toString
})
