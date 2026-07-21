import { Settings } from './generated-types'
import { MoengageSDK } from './types'

export function initializeSDK(settings: Settings): Promise<void> {
    const {
        moeDataCenter,
    } = settings

    return new Promise<void>((resolve, reject) => {
        /* eslint-disable */
        const e = window
        const n = document
        const i = "script"
        const t = `https://cdn.moengage.com/release/${moeDataCenter}/moe_webSdk.min.latest.js`
        const a = "Moengage"
        let r: HTMLScriptElement
        let o: HTMLElement

        if (!moeDataCenter || !moeDataCenter.match(/^dc_[0-9]+$/gm)){
            return console.error( "Data center has not been passed correctly. Please follow the SDK installation instruction carefully." )
        }
        // @ts-expect-error - vendor code: e[a] is a dynamic stub array before the real SDK loads
        var s = (e[a] = e[a] || [])
        // @ts-expect-error - vendor code: s.invoked and s.initialised are set by the real SDK at runtime
        if (((s.invoked = 0), s.initialised > 0 || s.invoked > 0)) {
            console.error("MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!")
            return
        }
        e.moengage_object = a;
        var l = {};
        var g= function n(i: string) {
            return function () {
                for (var n = arguments.length, t = Array(n), a = 0; a < n; a++)
                t[a] = arguments[a];
                (e.moengage_q = e.moengage_q || []).push({ f: i, a: t });
            };
        };
        var u = [
            "track_event",
            "add_user_attribute",
            "add_first_name",
            "add_last_name",
            "add_email",
            "add_mobile",
            "add_user_name",
            "add_gender",
            "add_birthday",
            "destroy_session",
            "add_unique_user_id",
            "update_unique_user_id",
            "moe_events",
            "call_web_push",
            "track",
            "location_type_attribute",
            "identifyUser",
            "getUserIdentities"
        ];
        var m = { onsite: ["getData", "registerCallback", "getSelfHandledOSM"] };

        // @ts-expect-error - vendor code
        for (var c in u) l[u[c]] = g(u[c]);
        
        for (var v in m) {
            // @ts-expect-error - vendor code
            for (var f in m[v]) {
                // @ts-expect-error - vendor code
                null == l[v] && (l[v] = {}), (l[v][m[v][f]] = g(v + "." + m[v][f]));
            }
        }

        r = n.createElement(i)
        o = n.getElementsByTagName("head")[0]
        r.async = true
        r.src = t
        o.appendChild(r)
        e.moe = e.moe || function(): MoengageSDK {
            // @ts-expect-error - vendor code: s.invoked is set at runtime by the real SDK
            s.invoked = s.invoked + 1
            // @ts-expect-error - vendor code: s.invoked is set at runtime by the real SDK
            if (s.invoked > 1) {
                console.error("MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!")
            }
            return l as unknown as MoengageSDK
        }

        r.addEventListener("load", function () {
            resolve()
        });

        r.addEventListener("error", function () {
            reject(new Error("Moengage Web SDK loading failed."))
        });
    
        /* eslint-enable */
    }) // end Promise
}