import nock from 'nock'
import mapValues from 'lodash/mapValues'
import { DecoratedResponse, createTestIntegration } from '@segment/actions-core'
import CustomerIO from './index'
import { Settings } from './generated-types'
import { AccountRegion } from './utils'

const testDestination = createTestIntegration(CustomerIO)

enum EndpointType {
  BATCH = 'batch',
  SINGLE = 'entity'
}
const endpointByType = {
  [EndpointType.BATCH]: 'batch',
  [EndpointType.SINGLE]: 'entity'
}
const trackServiceByRegion = {
  [AccountRegion.US]: nock('https://track.customer.io'),
  [AccountRegion.EU]: nock('https://track-eu.customer.io')
}

function wrapFn(fn: Function, type: string, region: AccountRegion) {
  return () => {
    const settings: Settings = {
      siteId: '12345',
      apiKey: 'abcde',
      accountRegion: region
    }

    const action = async (name: string, args: Record<string, unknown>) => {
      const actionFn = {
        [EndpointType.BATCH]: testDestination.testBatchAction,
        [EndpointType.SINGLE]: testDestination.testAction
      }[type]

      if (type === EndpointType.BATCH) {
        args.events = [args.event]
      }

      const responses = (await actionFn?.call(testDestination, name, args)) as DecoratedResponse[]

      if (!responses.length) {
        // Batch events do not throw errors when payloads are invalid (they're just dropped)
        // @see https://github.com/segmentio/action-destinations/blob/1f6de570caa28267dfb1b0113286e6b50c26feb0/packages/core/src/destination-kit/action.ts#L182
        if (type === EndpointType.BATCH) {
          await testDestination.testAction(name, args)
        }

        throw new Error(`No responses received.`)
      }

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})

      if (type === EndpointType.BATCH) {
        return (responses[0].options.json as { batch: unknown[] }).batch[0]
      }

      return responses[0].options.json
    }

    return fn(settings, action)
  }
}

export const nockTrackInternalEndpoint = (region: AccountRegion) => trackServiceByRegion[region]

export function getDefaultMappings(action: string) {
  const fields = testDestination.definition.actions[action].fields
  const defaultMappings = mapValues(fields, 'default')

  return defaultMappings
}

export function testRunner(fn: Function) {
  describe.each(Object.values(endpointByType))(`when using %s requests`, (type) => {
    describe.each(Object.values(AccountRegion))(`when using the %s region`, (region) => {
      beforeEach(() => {
        trackServiceByRegion[region].post(`/api/v2/${type}`).reply(200, {})
      })

      afterEach(() => {
        nock.cleanAll()
      })

      return wrapFn(fn, type, region)()
    })
  })
}
