import { Settings } from './generated-types'

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
        let d: unknown 

        if (!moeDataCenter || !moeDataCenter.match(/^dc_[0-9]+$/gm)){
            return console.error( "Data center has not been passed correctly. Please follow the SDK installation instruction carefully." )
        }
        // @ts-expect-error - vendor code
        var s = (e[a] = e[a] || []);
        // @ts-expect-error - vendor code: s is an untyped stub object with invoked/initialised properties
        if (((s.invoked = 0), s.initialised > 0 || s.invoked > 0)){
            return (console.error("MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!"),!1);
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
        e.moe = e.moe ||
            function () {
                return ((s.invoked = s.invoked + 1), s.invoked > 1)
                    ? (console.error("MoEngage Web SDK initialised multiple times. Please integrate the Web SDK only once!"),!1)
                    : ((d = arguments.length <= 0 ? void 0 : arguments[0]), l);
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