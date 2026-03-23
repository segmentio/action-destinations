import { Settings } from './generated-types'

export function initializeSDK(settings: Settings): Promise<void> {
    const { moeDataCenter } = settings

    if (!moeDataCenter || !moeDataCenter.match(/^dc_[0-9]+$/gm)) {
        console.error('Data center has not been passed correctly. Please follow the SDK installation instruction carefully.')
        return Promise.resolve()
    }

    // MoEngage SDK stub setup - vendor code
    /* eslint-disable */
    const e = window
    const a = 'Moengage'
    // @ts-expect-error - vendor code
    var s = (e[a] = e[a] || [])
    if ((s.invoked = 0), s.initialised > 0 || s.invoked > 0) {
        console.error('MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!')
        return Promise.resolve()
    }
    e.moengage_object = a
    // @ts-expect-error - vendor code
    var l = {},
        // @ts-expect-error - vendor code
        g = function(i: string) {
            return function() {
                for (var n = arguments.length, t = Array(n), x = 0; x < n; x++) t[x] = arguments[x]
                ;(e.moengage_q = e.moengage_q || []).push({ f: i, a: t })
            }
        },
        u = [
            'track_event', 'add_user_attribute', 'add_first_name', 'add_last_name',
            'add_email', 'add_mobile', 'add_user_name', 'add_gender', 'add_birthday',
            'destroy_session', 'add_unique_user_id', 'update_unique_user_id', 'moe_events',
            'call_web_push', 'track', 'location_type_attribute', 'identifyUser', 'getUserIdentities',
        ],
        // @ts-expect-error - vendor code
        m: Record<string, string[]> = { onsite: ['getData', 'registerCallback', 'getSelfHandledOSM'] }
    // @ts-expect-error - vendor code
    for (var c in u) l[u[c]] = g(u[c])
    for (var v in m)
        for (var f in m[v])
            // @ts-expect-error - vendor code
            null == l[v] && (l[v] = {}), (l[v][m[v][f]] = g(v + '.' + m[v][f]))
    // @ts-expect-error - vendor code
    e.moe = e.moe || function() {
        return ((s.invoked = s.invoked + 1), s.invoked > 1)
            ? (console.error('MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!'), !1)
            : l
    }
    /* eslint-enable */

    // Load the real SDK script and return a Promise that resolves when it is ready.
    // window.moe(initConfig) must be called AFTER this promise resolves so that it
    // hits the real SDK function (not the stub above), avoiding the double-init error.
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.async = true
        script.src = `https://cdn.moengage.com/release/${moeDataCenter}/moe_webSdk.min.latest.js`
        script.addEventListener('load', () => resolve())
        script.addEventListener('error', () => {
            console.error('Moengage Web SDK loading failed.')
            reject(new Error('Moengage Web SDK loading failed.'))
        })
        document.getElementsByTagName('head')[0].appendChild(script)
    })
}