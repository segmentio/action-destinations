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
