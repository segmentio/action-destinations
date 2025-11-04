import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AwsKinesis.send', () => {
  testDestination
  // TODO: Test your action
})
