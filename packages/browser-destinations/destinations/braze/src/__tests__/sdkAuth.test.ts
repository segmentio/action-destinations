import { transform } from '@segment/actions-core'
import { destination } from '../index'
import updateUserProfile from '../updateUserProfile'
import type { Settings } from '../generated-types'
import type { BrazeDestinationClient } from '../braze-types'

type SdkAuthFailure = { errorCode: number; reason?: string; userId?: string; signature?: string }

const baseSettings: Settings = {
  api_key: 'b_123',
  endpoint: 'sdk.iad-01.braze.com',
  sdkVersion: '6.10'
}

/**
 * A stand-in for the Braze SDK. The real bundles are fetched from the CDN by the other
 * suites in this package; stubbing here keeps these assertions about *our* call sequence
 * and lets us model SDK 3.1, which ships neither SDK Authentication method.
 */
function stubInstance(overrides: Record<string, unknown> = {}) {
  return {
    initialize: jest.fn().mockReturnValue(true),
    openSession: jest.fn(),
    changeUser: jest.fn(),
    setSdkAuthenticationSignature: jest.fn().mockReturnValue(true),
    subscribeToSdkAuthenticationFailures: jest.fn().mockReturnValue('subscription-id'),
    addSdkMetadata: jest.fn(),
    BrazeSdkMetadata: { SEGMENT: 'segment' },
    display: { automaticallyShowNewInAppMessages: jest.fn() },
    getUser: jest.fn().mockReturnValue({}),
    ...overrides
  }
}

async function initClient(
  settings: Partial<Settings> = {},
  instanceOverrides: Record<string, unknown> = {},
  knownUserId: string | null = null
): Promise<{ client: BrazeDestinationClient; instance: ReturnType<typeof stubInstance> }> {
  const instance = stubInstance(instanceOverrides)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).braze = instance

  // Only Track Known Users gates initialization on analytics.js's own user id, so tests can
  // model a known (persisted or identified) user or an anonymous visitor.
  const analytics = { user: () => ({ id: () => knownUserId }) }
  const client = await initialize(
    { settings: { ...baseSettings, ...settings }, analytics },
    { loadScript: jest.fn(), resolveWhen: jest.fn() }
  )

  return { client, instance }
}

// The stubbed SDK and the partial ExecuteInput below are deliberately loose: these tests
// exercise our call sequence, not the shapes the runtime builds.
/* eslint-disable @typescript-eslint/no-explicit-any */
const initialize = destination.initialize as (data: any, deps: any) => Promise<BrazeDestinationClient>
const performIdentify = destination.actions.updateUserProfile.perform as (
  client: BrazeDestinationClient,
  data: any
) => void
/* eslint-enable @typescript-eslint/no-explicit-any */

function identify(client: BrazeDestinationClient, payload: Record<string, unknown>): void {
  performIdentify(client, { payload })
}

describe('Braze SDK Authentication', () => {
  describe('changeUser', () => {
    test('passes the signature through when one is mapped', async () => {
      const { client, instance } = await initClient({ enableSdkAuthentication: true })

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })

      expect(instance.changeUser).toHaveBeenCalledWith('user-1', 'jwt-1')
    })

    test('omits the second argument entirely when no signature is mapped', async () => {
      const { client, instance } = await initClient()

      identify(client, { external_id: 'user-1' })

      // Asserting on arity, not just the value: passing an explicit `undefined` would be a
      // behavior change for every existing customer across 13 supported SDK versions.
      expect(instance.changeUser).toHaveBeenCalledWith('user-1')
      expect(instance.changeUser.mock.calls[0]).toHaveLength(1)
      expect(instance.setSdkAuthenticationSignature).not.toHaveBeenCalled()
    })

    test('ignores a mapped signature entirely when SDK Authentication is off', async () => {
      const { client, instance } = await initClient({ enableSdkAuthentication: false })

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })

      // The setting is the gate: a customer who starts sending tokens before switching it on
      // must see exactly the pre-SDK-Authentication call, and no credential handed to the SDK.
      expect(instance.changeUser).toHaveBeenCalledWith('user-1')
      expect(instance.changeUser.mock.calls[0]).toHaveLength(1)
      expect(instance.setSdkAuthenticationSignature).not.toHaveBeenCalled()
    })
  })

  describe('token refresh', () => {
    test('applies the signature explicitly, not only through changeUser', async () => {
      const { client, instance } = await initClient({ enableSdkAuthentication: true })

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })

      // On SDK 3.3, changeUser ignores the signature for a user Braze already has persisted,
      // which is every returning visitor on a fresh page load. The explicit call is what
      // applies it there; the stub cannot model 3.3, so assert the call is made.
      expect(instance.changeUser).toHaveBeenCalledWith('user-1', 'jwt-1')
      expect(instance.setSdkAuthenticationSignature).toHaveBeenCalledWith('jwt-1')
    })

    test('applies a refreshed signature for the same user', async () => {
      const { client, instance } = await initClient({ enableSdkAuthentication: true })

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })
      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-2' })

      expect(instance.setSdkAuthenticationSignature).toHaveBeenLastCalledWith('jwt-2')
    })

    test('switches user and signature together when the user changes', async () => {
      const { client, instance } = await initClient({ enableSdkAuthentication: true })

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })
      identify(client, { external_id: 'user-2', sdk_auth_signature: 'jwt-2' })

      expect(instance.changeUser).toHaveBeenLastCalledWith('user-2', 'jwt-2')
      expect(instance.setSdkAuthenticationSignature).toHaveBeenLastCalledWith('jwt-2')
    })
  })

  describe('failure subscriber', () => {
    test('is registered when SDK Authentication is enabled', async () => {
      const { instance } = await initClient({ enableSdkAuthentication: true })

      expect(instance.subscribeToSdkAuthenticationFailures).toHaveBeenCalledTimes(1)
    })

    test('is not registered when SDK Authentication is off', async () => {
      const { instance } = await initClient({ enableSdkAuthentication: false })

      expect(instance.subscribeToSdkAuthenticationFailures).not.toHaveBeenCalled()
    })

    test('logs the error code and reason, never the signature', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const { instance } = await initClient({ enableSdkAuthentication: true })

      const subscriber = instance.subscribeToSdkAuthenticationFailures.mock.calls[0][0] as (
        error: SdkAuthFailure
      ) => void
      subscriber({ errorCode: 22, reason: 'The token provided has expired', userId: 'user-1', signature: 'jwt-secret' })

      expect(consoleError).toHaveBeenCalledTimes(1)
      const logged = consoleError.mock.calls[0][0] as string
      expect(logged).toContain('22')
      expect(logged).toContain('The token provided has expired')
      expect(logged).not.toContain('jwt-secret')
    })
  })

  describe('deferUntilIdentified (Only Track Known Users)', () => {
    test('signs the identify for a known user without changing how the gate opens', async () => {
      const { client, instance } = await initClient(
        { deferUntilIdentified: true, enableSdkAuthentication: true },
        {},
        'user-1'
      )

      // The gate reads analytics.js's user id, so a known user initializes the SDK as before.
      expect(instance.initialize).toHaveBeenCalledTimes(1)

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })

      expect(instance.changeUser).toHaveBeenCalledWith('user-1', 'jwt-1')
      expect(instance.setSdkAuthenticationSignature).toHaveBeenCalledWith('jwt-1')
    })

    test('an anonymous visitor still initializes nothing, token or not', async () => {
      const { client, instance } = await initClient(
        { deferUntilIdentified: true, enableSdkAuthentication: true },
        {},
        null
      )

      identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })

      // A mapped token must never open the gate on its own: initialization is decided only by
      // whether analytics.js knows the user.
      expect(instance.initialize).not.toHaveBeenCalled()
      expect(instance.changeUser).not.toHaveBeenCalled()
      expect(instance.setSdkAuthenticationSignature).not.toHaveBeenCalled()
    })
  })

  describe('default mapping', () => {
    const defaultMapping = { sdk_auth_signature: updateUserProfile.fields.sdk_auth_signature.default }

    test('resolves the signature from the integrations object', () => {
      // The integrations key contains spaces and parentheses, so this asserts the `@path`
      // is actually resolvable and not silently undefined.
      const output = transform(defaultMapping, {
        integrations: { 'Braze Web Mode (Actions)': { sdk_auth_signature: 'jwt-1' } }
      })

      expect(output).toEqual({ sdk_auth_signature: 'jwt-1' })
    })

    test('accepts the camelCase spelling', () => {
      const output = transform(defaultMapping, {
        integrations: { 'Braze Web Mode (Actions)': { sdkAuthSignature: 'jwt-1' } }
      })

      expect(output).toEqual({ sdk_auth_signature: 'jwt-1' })
    })

    test('resolves to nothing when no token is supplied', () => {
      const output = transform(defaultMapping, { integrations: { 'Braze Web Mode (Actions)': true } })

      expect(output).toEqual({})
    })
  })

  describe('SDK 3.1 compatibility', () => {
    test('falls back to changeUser and skips the subscriber when the methods are absent', async () => {
      const { client, instance } = await initClient(
        { enableSdkAuthentication: true },
        { setSdkAuthenticationSignature: undefined, subscribeToSdkAuthenticationFailures: undefined }
      )

      expect(() => {
        identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-1' })
        identify(client, { external_id: 'user-1', sdk_auth_signature: 'jwt-2' })
      }).not.toThrow()

      expect(instance.changeUser).toHaveBeenNthCalledWith(1, 'user-1', 'jwt-1')
      expect(instance.changeUser).toHaveBeenNthCalledWith(2, 'user-1', 'jwt-2')
    })
  })
})
