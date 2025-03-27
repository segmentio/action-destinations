import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import hubbleDestination, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    name: 'Identify user',
    subscribe: 'type = "identify"',
    partnerAction: 'identify',
    enabled: true,
    mapping: {
      userId: {
        type: 'string',
        required: true,
        label: 'User ID',
        description: 'Unique user ID',
        default: {
          '@path': '$.userId'
        }
      },
      anonymousId: {
        type: 'string',
        required: false,
        description: 'Anonymous id of the user',
        label: 'Anonymous ID',
        default: {
          '@path': '$.anonymousId'
        }
      },
      attributes: {
        type: 'object',
        required: false,
        description: 'User traits used to enrich user identification',
        label: 'Traits',
        default: {
          '@path': '$.traits'
        }
      }
    }
  },
  {
    name: 'Track event',
    subscribe: 'type = "track"',
    partnerAction: 'track',
    enabled: true,
    mapping: {
      event: {
        description: 'Event to be tracked',
        label: 'Event',
        required: true,
        type: 'string',
        default: {
          '@path': '$.event'
        }
      },
      attributes: {
        description: 'Object containing the attributes (properties) of the event',
        type: 'object',
        required: false,
        label: 'Event Attributes',
        default: {
          '@path': '$.properties'
        }
      }
    }
  }
]

describe('Hubble', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
    jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
      resolveWhen: (_fn: any, _timeout: any) => {}
    }))
  })

  const testID = 'testId'

  test('load Hubble SDK', async () => {
    const [event] = await hubbleDestination({
      id: testID,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchSnapshot(`
    <script
      type="text/javascript"
      src="https://sdk.hubble.team/sdk/${testID}.js"
      async=""
      status="loaded">
      </script>
    `)
  })
})
