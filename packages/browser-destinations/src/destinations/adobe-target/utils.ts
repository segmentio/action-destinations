/* eslint-disable */
// @ts-nocheck

export function getPageParams() {
  return window.pageParams
}

export function setPageParams(params) {
  return (window.pageParams = { ...window.pageParams, ...params })
}
