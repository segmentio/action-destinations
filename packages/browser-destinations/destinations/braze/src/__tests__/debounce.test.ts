import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination from '../index'
import { resetUserCache } from '../debounce'

let ajs: Analytics

describe('debounce', () => {
  beforeEach(async () => {
    ajs = new Analytics({
      writeKey: 'w_123'
    })
  })

  test('changes the integration object', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '3.5',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await debounce.load(Context.system(), ajs)
    const ctx = await debounce.identify?.(
      new Context({
        type: 'identify',
        userId: 'hasbulla',
        anonymousId: 'the goat',
        traits: {}
      })
    )

    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)
  })

  test('does not send the event to braze if IDs are the same', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '3.5',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    const ctx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)

    const secondCtx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(secondCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)
  })

  test('ignores blank anonymous ids', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '4.1',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    const ctx = await ajs.identify()
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)

    const secondCtx = await ajs.identify()
    expect(secondCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)
  })

  test('send events on trait changes', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '4.1',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    const ctx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)

    const sameCtx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(sameCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)

    const changedTraits = await ajs.identify('hasbulla', {
      weight: 'feather'
    })
    expect(changedTraits.event.integrations['Braze Web Mode (Actions)']).toBe(true)
  })

  test('preserves integration options when sending', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '4.1',
      enableSdkAuthentication: true,
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    // The SDK Authentication signature is supplied under this key, so overwriting it with
    // `true` would silently drop the token before updateUserProfile ever reads it.
    const ctx = await ajs.identify(
      'hasbulla',
      { goat: true },
      { integrations: { 'Braze Web Mode (Actions)': { sdk_auth_signature: 'jwt-1' } } }
    )
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toEqual({ sdk_auth_signature: 'jwt-1' })

    // Skipping still has to win: an unchanged identify must not be sent to Braze.
    const sameCtx = await ajs.identify(
      'hasbulla',
      { goat: true },
      { integrations: { 'Braze Web Mode (Actions)': { sdk_auth_signature: 'jwt-1' } } }
    )
    expect(sameCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)
  })

  test('keeps the options object only under the Braze Web Mode key', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '4.1',
      enableSdkAuthentication: true,
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    // Only Web Mode reads the signature; the other Braze keys get `true` as before, so the
    // token does not travel further with the event than it has to.
    const ctx = await ajs.identify(
      'hasbulla',
      { goat: true },
      {
        integrations: {
          'Braze Web Mode (Actions)': { sdk_auth_signature: 'jwt-1' },
          'Braze Cloud Mode (Actions)': { sdk_auth_signature: 'jwt-1' },
          Appboy: { sdk_auth_signature: 'jwt-1' }
        }
      }
    )
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toEqual({ sdk_auth_signature: 'jwt-1' })
    expect(ctx.event.integrations['Braze Cloud Mode (Actions)']).toBe(true)
    expect(ctx.event.integrations['Appboy']).toBe(true)
  })

  test('with SDK Authentication off, still overwrites integration options with true', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      doNotLoadFontAwesome: true,
      sdkVersion: '4.1',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    // Customers who have not opted in see debounce behave exactly as it did before.
    const ctx = await ajs.identify(
      'hasbulla',
      { goat: true },
      { integrations: { 'Braze Web Mode (Actions)': { sdk_auth_signature: 'jwt-1' } } }
    )
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)
  })

  describe('SDK Authentication token refresh', () => {
    const WEB_MODE = 'Braze Web Mode (Actions)'
    const withToken = (jwt: string) => ({ integrations: { [WEB_MODE]: { sdk_auth_signature: jwt } } })

    const register = async (enableSdkAuthentication: boolean) => {
      const [debounce] = await brazeDestination({
        api_key: 'b_123',
        endpoint: 'endpoint',
        doNotLoadFontAwesome: true,
        sdkVersion: '4.1',
        enableSdkAuthentication,
        subscriptions: [
          {
            partnerAction: 'debounce',
            name: 'Debounce',
            enabled: true,
            subscribe: 'type = "identify"',
            mapping: {}
          }
        ]
      })
      await ajs.register(debounce)
    }

    beforeEach(() => resetUserCache())

    test('same traits with a new token is sent, and the same token is skipped', async () => {
      await register(true)

      const first = await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      expect(first.event.integrations?.[WEB_MODE]).toEqual({ sdk_auth_signature: 'jwt-1' })

      const refreshed = await ajs.identify('refresh-user', { goat: true }, withToken('jwt-2'))
      expect(refreshed.event.integrations?.[WEB_MODE]).toEqual({ sdk_auth_signature: 'jwt-2' })

      const repeated = await ajs.identify('refresh-user', { goat: true }, withToken('jwt-2'))
      expect(repeated.event.integrations?.[WEB_MODE]).toBe(false)
    })

    test('an event without a token is not a change', async () => {
      await register(true)

      await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      const withoutToken = await ajs.identify('refresh-user', { goat: true })
      expect(withoutToken.event.integrations?.[WEB_MODE]).toBe(false)

      // The remembered token survives the tokenless event, so the same one is still not a change.
      const sameAgain = await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      expect(sameAgain.event.integrations?.[WEB_MODE]).toBe(false)
    })

    test('with SDK Authentication off, a new token is still skipped', async () => {
      await register(false)

      await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      const refreshed = await ajs.identify('refresh-user', { goat: true }, withToken('jwt-2'))
      expect(refreshed.event.integrations?.[WEB_MODE]).toBe(false)
    })

    test('a blank or non-string token is not a change', async () => {
      await register(true)

      await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      for (const bad of ['  ', 42, { not: 'a string' }]) {
        const ctx = await ajs.identify('refresh-user', { goat: true }, {
          integrations: { [WEB_MODE]: { sdk_auth_signature: bad } }
        } as never)
        expect(ctx.event.integrations?.[WEB_MODE]).toBe(false)
      }
    })

    test('resetUserCache forgets the remembered token', async () => {
      await register(true)

      await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      resetUserCache()
      const afterReset = await ajs.identify('refresh-user', { goat: true }, withToken('jwt-1'))
      expect(afterReset.event.integrations?.[WEB_MODE]).toEqual({ sdk_auth_signature: 'jwt-1' })
    })
  })
})
