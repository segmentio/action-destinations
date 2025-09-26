// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'

export const EXTERNAL_PROVIDER = 'segment_io'
export const GQL_ENDPOINT = 'https://api.stackadapt.com/graphql'


export function sha256hash(data: string) {
  const hash = createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

// transform an array of mapping objects into a string which can be sent as parameter in a GQL request
export function stringifyJsonWithEscapedQuotes(value: unknown) {
  const jsonString = JSON.stringify(value);
  
  // Finally escape all remaining quotes
  return jsonString.replace(/"/g, '\\"');
}

// transform mapping schema for direct insertion into GraphQL queries (no quote escaping)
export function stringifyMappingSchemaForGraphQL(value: unknown) {
  let jsonString = JSON.stringify(value);
  
  // Replace "type":"VALUE" with type:VALUE (unquoted enum and field)
  jsonString = jsonString.replace(/"type":"([^"]+)"/g, (_, typeValue: string) => 
    `type:${typeValue.toUpperCase()}`);
  
  // Remove quotes from all object keys to make it valid GraphQL syntax
  jsonString = jsonString.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '$1:');
  
  return jsonString;
}
