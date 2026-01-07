import { Analytics, Context, JSONValue, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../'
import { DESTINATION_NAME } from '../constants'

const example: Subscription[] = [
  {
    partnerAction: 'sessionAttributesEncoded',
    name: 'Session Attributes Encoded Enrichment Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let sessionAttributesEncodedPlugin: Plugin
let ajs: Analytics

beforeAll(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example } as unknown as JSONValue)
  sessionAttributesEncodedPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z'))

  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://example.com?gad_click_id=123&gad_user_id=456&gclid=gclid1234&gbraid=gbraid5678',
      search: '?gad_click_id=123&gad_user_id=456&gclid=gclid1234&gbraid=gbraid5678'
    },
    writable: true,
    configurable: true
  })

  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    writable: true,
    configurable: true
  })

  Object.defineProperty(document, 'referrer', {
    value: 'https://referrer.com',
    writable: true,
    configurable: true
  })
})

afterAll(() => {
  jest.useRealTimers() 
})

describe('ajs-integration', () => {
  test('updates the original event with a Google Enhanced Conversions querystring values', async () => {
    await sessionAttributesEncodedPlugin.load(Context.system(), ajs)
    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })
    const updatedCtx = await sessionAttributesEncodedPlugin.track?.(ctx)
    const gecIntegrationsObj = updatedCtx?.event?.integrations[DESTINATION_NAME]
    expect(gecIntegrationsObj).toEqual(
      {"session_attributes_encoded": "eyJnYWRfY2xpY2tfaWQiOiIxMjMiLCJnYWRfdXNlcl9pZCI6IjQ1NiIsInNlc3Npb25fc3RhcnRfdGltZV91c2VjIjoiMTY3MjUzMTIwMDAwMDAwMCIsImxhbmRpbmdfcGFnZV91cmwiOiJodHRwczovL2V4YW1wbGUuY29tP2dhZF9jbGlja19pZD0xMjMmZ2FkX3VzZXJfaWQ9NDU2JmdjbGlkPWdjbGlkMTIzNCZnYnJhaWQ9Z2JyYWlkNTY3OCIsImxhbmRpbmdfcGFnZV9yZWZlcnJlciI6Imh0dHBzOi8vcmVmZXJyZXIuY29tIiwibGFuZGluZ19wYWdlX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTEuMC40NDcyLjEyNCBTYWZhcmkvNTM3LjM2In0"}
    )
  })

  test('New URL with no querystring should result in cashed session_attributes_encoded value being used', async () => {
    // Note that this test will fail if executed on its own. It requires the previous test to first be executed. 
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com',
        search: '' // Empty querystring
      },
      writable: true,
      configurable: true
    })
    
    await sessionAttributesEncodedPlugin.load(Context.system(), ajs)
    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })
    const updatedCtx = await sessionAttributesEncodedPlugin.track?.(ctx)
    const gecIntegrationsObj = updatedCtx?.event?.integrations[DESTINATION_NAME]
    expect(gecIntegrationsObj).toEqual(
      {"session_attributes_encoded": "eyJnYWRfY2xpY2tfaWQiOiIxMjMiLCJnYWRfdXNlcl9pZCI6IjQ1NiIsInNlc3Npb25fc3RhcnRfdGltZV91c2VjIjoiMTY3MjUzMTIwMDAwMDAwMCIsImxhbmRpbmdfcGFnZV91cmwiOiJodHRwczovL2V4YW1wbGUuY29tP2dhZF9jbGlja19pZD0xMjMmZ2FkX3VzZXJfaWQ9NDU2JmdjbGlkPWdjbGlkMTIzNCZnYnJhaWQ9Z2JyYWlkNTY3OCIsImxhbmRpbmdfcGFnZV9yZWZlcnJlciI6Imh0dHBzOi8vcmVmZXJyZXIuY29tIiwibGFuZGluZ19wYWdlX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTEuMC40NDcyLjEyNCBTYWZhcmkvNTM3LjM2In0"}
    )
  })

  test('New querystring values result in a new session_attributes_encoded value', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com?gad_click_id=999&gad_user_id=4567&gclid=gclid19876543567&gbraid=gbraid567dfsfsdfd',
        search: '?gad_click_id=999&gad_user_id=4567&gclid=gclid19876543567&gbraid=gbraid567dfsfsdfd'
      },
      writable: true,
      configurable: true
    })
    
    await sessionAttributesEncodedPlugin.load(Context.system(), ajs)
    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })
    const updatedCtx = await sessionAttributesEncodedPlugin.track?.(ctx)
    const gecIntegrationsObj = updatedCtx?.event?.integrations[DESTINATION_NAME]
    expect(gecIntegrationsObj).toEqual(
      { "session_attributes_encoded": "eyJnYWRfY2xpY2tfaWQiOiIxMjMiLCJnYWRfdXNlcl9pZCI6IjQ1NiIsInNlc3Npb25fc3RhcnRfdGltZV91c2VjIjoiMTY3MjUzMTIwMDAwMDAwMCIsImxhbmRpbmdfcGFnZV91cmwiOiJodHRwczovL2V4YW1wbGUuY29tP2dhZF9jbGlja19pZD0xMjMmZ2FkX3VzZXJfaWQ9NDU2JmdjbGlkPWdjbGlkMTIzNCZnYnJhaWQ9Z2JyYWlkNTY3OCIsImxhbmRpbmdfcGFnZV9yZWZlcnJlciI6Imh0dHBzOi8vcmVmZXJyZXIuY29tIiwibGFuZGluZ19wYWdlX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTEuMC40NDcyLjEyNCBTYWZhcmkvNTM3LjM2In0"}
    )
  })
})
