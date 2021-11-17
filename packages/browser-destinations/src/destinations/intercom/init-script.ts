// Loads Intercom with the snippet
// This must be run before boot, it initializes window.Intercom
// prettier-ignore
export const load = (appId: string) => {
  /* eslint-disable */
  // @ts-expect-error expect errors on minified code
  (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/' + appId;var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
  /* eslint-enable */
}

// Initializes Intercom
export const boot = (appId: string, options = {}) => {
  window && window.Intercom && window.Intercom('boot', { app_id: appId, ...options })
}
