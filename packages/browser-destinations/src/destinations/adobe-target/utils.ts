/* eslint-disable */
// @ts-nocheck

export function getPageParams() {
  return window.pageParams
}

export function setPageParams(params) {
  return (window.pageParams = { ...window.pageParams, ...params })
}

export function setMbox3rdPartyId(id) {
  setPageParams({ mbox3rdPartyId: id })
}

// Track does not accept arrays as valid properties, therefore we are stringifying them.
export function serializeProperties(props: { [key: string]: unknown } | undefined) {
  if (props === undefined) {
    return {}
  }

  const serialized: { [key: string]: unknown } = {}

  for (const key in props) {
    serialized[key] = props[key]
    if (Array.isArray(props[key])) {
      serialized[key] = JSON.stringify(props[key])
    }
  }

  return serialized
}
