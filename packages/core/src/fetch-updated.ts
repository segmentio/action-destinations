// import forked version of fetch ponyfill
import fetch, { Headers, Request, Response } from '@segment/cross-fetch'

const updatedFetch = fetch

export { Headers, Request, Response }
export default updatedFetch
