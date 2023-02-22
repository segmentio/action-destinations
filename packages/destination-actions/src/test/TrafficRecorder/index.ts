import http from 'http'
import path from 'path'
import isURL from 'is-url'
import assert from 'assert'
import talkback from 'talkback/es6'

const { NO_RECORD = false } = process.env

interface Destination {
  slug: string
  endpoint: string
}

class TrafficRecorder {
  isLiveTest: boolean
  integration?: Destination
  originalURL: string
  serverAddress?: string
  handler: any
  server?: http.Server

  constructor(integrationOrURL: Destination | string, { slug, tapesDir = 'tapes', isLiveTest = false } = {}) {
    assert(integrationOrURL, 'you must provide a URL or an integration instance')

    this.integration = undefined
    this.originalURL = ''

    // support passing a URL string and an integration directly
    // some integrations don't have a `.endpoint`, but we need support to record
    // their traffic somehow; in these cases, we'll pass the URL directly
    if (typeof integrationOrURL === 'string') {
      assert(isURL(integrationOrURL), 'invalid url')
      this.originalURL = integrationOrURL
    } else {
      assert(integrationOrURL.endpoint, 'integration.endpoint required')
      this.originalURL = integrationOrURL.endpoint
      slug = integrationOrURL.slug
      this.integration = integrationOrURL
    }

    assert(this.originalURL, 'url required')
    assert(slug, 'slug required')

    if (!isLiveTest) {
      const dirname = path.join(__dirname, tapesDir, slug)

      this.handler = talkback({
        host: this.originalURL,
        record: talkback.Options.RecordMode.NEW,
        port: 5544,
        path: dirname
      })
    }
  }

  start() {
    return this.handler.start()
  }

  stop() {
    return this.handler.close()
  }
}

export default TrafficRecorder
