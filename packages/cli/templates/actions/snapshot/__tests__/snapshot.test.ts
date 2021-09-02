import { createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import prettier from 'prettier'

const testDestination = createTestIntegration(destination)

describe('Testing snapshot for {{destination}} action:', () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} [required]`, async () => {
      const responses = await testDestination.snapshotAction(destination, actionSlug, true)
      const request = responses[0].request

      expect(request.headers).toMatchSnapshot()

      if (request.body) {
        const bodyString = decodeURIComponent(request.body.toString())
        if (bodyString[0] === '{') {
          expect(prettier.format(request.body.toString(), { parser: 'json' })).toMatchSnapshot()
        } else {
          expect(request.body.toString()).toMatchSnapshot()
        }
      }
    })

    it(`${actionSlug} [all fields]`, async () => {
      const responses = await testDestination.snapshotAction(destination, actionSlug, false)
      const request = responses[0].request

      if (request.body) {
        const bodyString = decodeURIComponent(request.body.toString())
        if (bodyString[0] === '{') {
          expect(prettier.format(request.body.toString(), { parser: 'json' })).toMatchSnapshot()
        } else {
          expect(request.body.toString()).toMatchSnapshot()
        }
      }
    })
  }
})
