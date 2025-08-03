/* eslint-disable */
// @ts-nocheck

export function send(tagId): Promise<void> {
  return new Promise((resolve, reject) => {
    ;(function (a, b, c, d) {
      a = `//www.mczbf.com/tags/${tagId}/tag.js`
      b = document
      c = 'script'
      d = b.createElement(c)
      d.src = a
      d.type = 'text/java' + c
      d.async = true
      d.id = 'cjapitag'
      d.onload = () => resolve()
      d.onerror = () => reject(new Error('JC script failed to load correctly'))
      a = b.getElementsByTagName(c)[0]
      a.parentNode.insertBefore(d, a)
    })()
  })
}