/* eslint-disable */
// @ts-nocheck
import { LDU } from './types'
import { getLDU } from './utils';

export function initScript(pixelId: string, ldu: keyof typeof LDU, disablePushState?: boolean ) {
  (function(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ?
        n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  if(ldu === LDU.Disabled.key) {
    window.fbq('dataProcessingOptions', [])
  }
  else {
    const lduObj = getLDU(ldu)
    window.fbq('dataProcessingOptions', ['LDU'], lduObj.country, lduObj.state)
  }

  window.fbq('init', pixelId)
  if(typeof disablePushState === 'boolean' && disablePushState === false) {
    // Customer will handle page tracking manually
    window.fbq.disablePushState = false
  } else {
    window.fbq('track', 'PageView')
  }
}