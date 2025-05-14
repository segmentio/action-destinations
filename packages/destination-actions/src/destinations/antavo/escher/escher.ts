import url from 'url'
import path from 'path'
import crypto from 'crypto'

export type acceptedMethods =
  'delete'
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'head'
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'

export class Escher {
  private config: {
    algorithmPrefix: string,
    vendorKey: string
    hashAlgorithm: string
    credentialScope: string
    authHeaderName: string
    dateHeaderName: string
    clockSkew: number
    accessKeyId: string
    apiSecret: string
  }

  public constructor(
    environment: string,
    apiKey: string,
    apiSecret: string
  ) {
    const credentialScope: string = environment + '/api/antavo_request'
    this.config = {
      algorithmPrefix: 'ANTAVO',
      vendorKey: 'Antavo',
      hashAlgorithm: 'SHA256',
      credentialScope: credentialScope,
      authHeaderName: 'authorization',
      dateHeaderName: 'date',
      clockSkew: 300,
      accessKeyId: apiKey,
      apiSecret: apiSecret
    }
  }

  public signRequest(
    requestOptions: {
      headers: Record<string, string>,
      method: acceptedMethods,
      host: string,
      url: string
    },
    body: any
  ): {
    headers: Record<string, string>,
    method: acceptedMethods,
    host: string,
    url: string,
    json: string[],
  } {
    const currentDate = new Date()
    const formattedDate = this.toLongDate(currentDate)
    const headersMap: Record<string, string> = {}
    const bodyJson = JSON.stringify(body)

    requestOptions['headers']['host'] = requestOptions.host
    requestOptions['headers']['date'] = formattedDate

    headersMap[this.config.dateHeaderName] = formattedDate
    headersMap[this.config.authHeaderName] = this.generateAuthHeader(requestOptions, bodyJson, currentDate)

    return {
      headers: headersMap,
      method: requestOptions.method,
      host: requestOptions.host,
      url: requestOptions.url,
      json: body
    }
  }

  private generateAuthHeader(
    requestOptions: {
      headers: Record<string, string>,
      method: acceptedMethods,
      host: string,
      url: string
    },
    body: string,
    currentDate: Date
  ): string {
    const algorithm = [
      this.config.algorithmPrefix,
      'HMAC',
      this.config.hashAlgorithm
    ].join('-')

    const fullCredentials = [
      this.config.accessKeyId,
      this.toShortDate(currentDate),
      this.config.credentialScope
    ].join('/')

    const signedHeaders = this.formatSignedHeaders(Object.keys(requestOptions.headers))

    const signKey = this.calculateSigningKey(currentDate)
    const stringToSign = this.getStringToSign(requestOptions, body, currentDate)

    const signature = crypto
      .createHmac(this.config.hashAlgorithm, signKey)
      .update(stringToSign, 'utf8')
      .digest('hex')

    return (
      algorithm +
      ' Credential=' +
      fullCredentials +
      ', SignedHeaders=' +
      signedHeaders +
      ', Signature=' +
      signature
    )
  }

  private canonicalizeQuery(query: string): string {
    if (query === '') {
      return ''
    }

    const encodeComponent = (component: string): string =>
      encodeURIComponent(component)
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')

    const join = (key: string, value: string): string => encodeComponent(key) + '=' + encodeComponent(value)
    let queryMap: Record<string, string> = {}

    query.split('&').forEach(value => {
      let query = value.split('=')
      queryMap[query[0]] = query[1]
    })

    return Object.keys(queryMap)
      .map(key => {
        return join(key, queryMap[key])
      })
      .sort()
      .join('&')
  }


  private canonicalizeRequest(
    requestOptions: {
      url: string;
      method: acceptedMethods;
      headers: Record<string, string>
    },
    body: string
  ): string {
    const preparedUrl = requestOptions.url
      .replace('#', '%23')
      .replace('\\', '%5C')
      .replace('+', '%20')
      .replace('%2B', '%20')
    const parsedUrl = url.parse(preparedUrl)
    const headers = Object.keys(requestOptions.headers).sort()
    const method = !(typeof requestOptions.method === 'undefined') ? requestOptions.method.toUpperCase() : ''
    const canonicalizedHeaders = headers.map(key => key + ':' + requestOptions.headers[key])
    const lines = [
      method,
      path.posix.normalize(parsedUrl.pathname ?? ''),
      this.canonicalizeQuery(parsedUrl.query ?? ''),
      canonicalizedHeaders.join('\n'),
      '',
      headers.join(';'),
      this.hash(this.config.hashAlgorithm, body)
    ]
    return lines.join('\n')
  }

  private getStringToSign(
    requestOptions: {
      url: string;
      method: acceptedMethods;
      headers: Record<string, string>
    },
    body: string,
    currentDate: Date
  ): string {
    return [
      `${this.config.algorithmPrefix}-HMAC-${this.config.hashAlgorithm}`,
      this.toLongDate(currentDate),
      `${this.toShortDate(currentDate)}/${this.config.credentialScope}`,
      this.hash(
        this.config.hashAlgorithm,
        this.canonicalizeRequest(requestOptions, body)
      )
    ].join('\n')
  }

  private calculateSigningKey(currentDate: Date): string {
    let signingKey: any = this.config.algorithmPrefix + this.config.apiSecret
    const authKeyParts = [this.toShortDate(currentDate), ...this.config.credentialScope.split(/\//g)]
    authKeyParts.forEach(data => {
      signingKey = crypto.createHmac(this.config.hashAlgorithm, signingKey).update(data, 'utf8').digest()
    })

    return signingKey
  }

  private toLongDate(date: Date): string {
    return date
      .toISOString()
      .replace(/-/g, '')
      .replace(/:/g, '')
      .replace(/\..*Z/, 'Z')
  }

  private toShortDate(date: Date): string {
    return this.toLongDate(date).substring(0, 8)
  }

  private hash(hashAlgorithm: string, string: string): string {
    return crypto
      .createHash(hashAlgorithm)
      .update(string, 'utf8')
      .digest('hex')
  }

  private formatSignedHeaders(signedHeaders: string[]): string {
    return signedHeaders
      .map(signedHeader => signedHeader.toLowerCase())
      .sort()
      .join(';')
  }
}
