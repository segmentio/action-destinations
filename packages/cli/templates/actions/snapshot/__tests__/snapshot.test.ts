import { createTestIntegration } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)

describe('Testing snapshot for {{destination}} action:', () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} [required]`, async () => {
      const responses = await testDestination.snapshotAction(destination, actionSlug, true)
      const requestBody = responses[0].request.body
      if (requestBody) {
        expect(requestBody.toString()).toMatchSnapshot()
      }
    })

    it(`${actionSlug} [all fields]`, async () => {
      const responses = await testDestination.snapshotAction(destination, actionSlug, false)
      const requestBody = responses[0].request.body
      if (requestBody) {
        expect(requestBody.toString()).toMatchSnapshot()
      }
    })
  }
})
