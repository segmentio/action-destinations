/* eslint-disable */
// @ts-nocheck

export function initScript({
  vwoAccountId,
  settingsTolerance = 2000,
  libraryTolerance = 2500,
  useExistingJquery = false,
  isSpa = 1
}) {
  window._vwo_code =
    window._vwo_code ||
    (function () {
      var account_id = vwoAccountId,
        settings_tolerance = settingsTolerance,
        library_tolerance = libraryTolerance,
        use_existing_jquery = useExistingJquery,
        is_spa = isSpa,
        hide_element = 'body',
        /* DO NOT EDIT BELOW THIS LINE */
        f = false,
        d = document,
        code = {
          use_existing_jquery: function () {
            return use_existing_jquery
          },
          library_tolerance: function () {
            return library_tolerance
          },
          finish: function () {
            if (!f) {
              f = true
              var a = d.getElementById('_vis_opt_path_hides')
              if (a) a.parentNode.removeChild(a)
            }
          },
          finished: function () {
            return f
          },
          load: function (a) {
            var b = d.createElement('script')
            b.src = a
            b.type = 'text/javascript'
            b.innerText
            b.onerror = function () {
              _vwo_code.finish()
            }
            d.getElementsByTagName('head')[0].appendChild(b)
          },
          init: function () {
            window.settings_timer = setTimeout(function () {
              _vwo_code.finish()
            }, settings_tolerance)
            var a = d.createElement('style'),
              b = hide_element
                ? hide_element + '{opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;}'
                : '',
              h = d.getElementsByTagName('head')[0]
            a.setAttribute('id', '_vis_opt_path_hides')
            a.setAttribute('type', 'text/css')
            if (a.styleSheet) a.styleSheet.cssText = b
            else a.appendChild(d.createTextNode(b))
            h.appendChild(a)
            this.load(
              'https://dev.visualwebsiteoptimizer.com/j.php?a=' +
                account_id +
                '&u=' +
                encodeURIComponent(d.URL) +
                '&f=' +
                +is_spa +
                '&r=' +
                Math.random() +
                '&s=segment.web'
            )
            return settings_timer
          }
        }
      window._vwo_settings_timer = code.init()
      return code
    })()
}
