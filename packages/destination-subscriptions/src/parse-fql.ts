import { lex, Token, types as TokenType } from '@segment/fql-ts'
import { Subscription, Condition, GroupConditionOperator, Operator, ConditionType } from './types'

const tokenToConditionType: Record<string, ConditionType> = {
  type: 'event-type',
  event: 'event',
  name: 'name',
  userId: 'userId',
  context: 'event-context',
  properties: 'event-property',
  traits: 'event-trait'
}

const getTokenValue = (token: Token): string | number | boolean => {
  if (token.type === 'string') {
    return token.value.replace(/^"/, '').replace(/"$/, '')
  }

  if (token.type === 'number') {
    return Number(token.value)
  }

  if (token.type === 'ident' && ['true', 'false'].includes(token.value)) {
    return token.value === 'true'
  }

  return String(token.value)
}

const isFqlFunction = (token: Token): boolean => {
  return token.type === 'ident' && ['contains', 'match'].includes(token.value)
}

const parseFqlFunction = (
  name: string,
  nodes: Condition[],
  tokens: Token[],
  { negate }: { negate: boolean } = { negate: false }
): void => {
  if (name === 'contains') {
    // Skip "(" token
    tokens.shift()

    const nameToken = tokens.shift()

    if (!nameToken) {
      throw new Error('contains() is missing a 1st argument')
    }

    // Skip "," token
    tokens.shift()

    const valueToken = tokens.shift()

    if (!valueToken) {
      throw new Error('contains() is missing a 2nd argument')
    }

    // Skip ")" token
    tokens.shift()

    if (['event', 'name', 'userId'].includes(nameToken.value)) {
      nodes.push({
        type: nameToken.value as 'event' | 'name' | 'userId',
        operator: negate ? 'not_contains' : 'contains',
        value: String(getTokenValue(valueToken))
      })
    }

    if (/^(properties)/.test(nameToken.value)) {
      nodes.push({
        type: 'event-property',
        name: nameToken.value.replace(/^(properties)\./, ''),
        operator: negate ? 'not_contains' : 'contains',
        value: String(getTokenValue(valueToken))
      })
    }

    if (/^(traits)/.test(nameToken.value)) {
      nodes.push({
        type: 'event-trait',
        name: nameToken.value.replace(/^(traits)\./, ''),
        operator: negate ? 'not_contains' : 'contains',
        value: String(getTokenValue(valueToken))
      })
    }

    if (/^(context)/.test(nameToken.value)) {
      nodes.push({
        type: 'event-context',
        name: nameToken.value.replace(/^(context)\./, ''),
        operator: negate ? 'not_contains' : 'contains',
        value: String(getTokenValue(valueToken))
      })
    }
  }

  if (name === 'match') {
    // Skip "(" token
    tokens.shift()

    const nameToken = tokens.shift()

    if (!nameToken) {
      throw new Error('match() is missing a 1st argument')
    }

    // Skip "," token
    tokens.shift()

    const valueToken = tokens.shift()

    if (!valueToken) {
      throw new Error('match() is missing a 2nd argument')
    }

    // Skip ")" token
    tokens.shift()

    let operator: Operator | undefined
    let value: string | undefined

    if (valueToken.value.endsWith('*"')) {
      operator = negate ? 'not_starts_with' : 'starts_with'
      value = String(getTokenValue(valueToken)).slice(0, -1)
    } else {
      operator = negate ? 'not_ends_with' : 'ends_with'
      value = String(getTokenValue(valueToken)).slice(1)
    }

    if (['event', 'name', 'userId'].includes(nameToken.value)) {
      nodes.push({
        type: nameToken.value as 'event' | 'name' | 'userId',
        operator,
        value
      })
    }

    if (/^(properties)/.test(nameToken.value)) {
      nodes.push({
        type: 'event-property',
        name: nameToken.value.replace(/^(properties)\./, ''),
        operator,
        value
      })
    }

    if (/^(traits)/.test(nameToken.value)) {
      nodes.push({
        type: 'event-trait',
        name: nameToken.value.replace(/^(traits)\./, ''),
        operator,
        value
      })
    }

    if (/^(context)/.test(nameToken.value)) {
      nodes.push({
        type: 'event-context',
        name: nameToken.value.replace(/^(context)\./, ''),
        operator,
        value
      })
    }
  }
}

const parse = (tokens: Token[]): Condition => {
  const nodes: Condition[] = []
  let operator = 'and'
  let token = tokens.shift()

  while (token && token.type !== 'eos') {
    if (token.type === 'ident') {
      const [tokenStart] = (token.value ?? '').split('.')
      const conditionType = tokenToConditionType[tokenStart]

      if (conditionType) {
        const operatorToken = tokens.shift()

        if (!operatorToken) {
          throw new Error('Operator token is missing')
        }

        const valueToken = tokens.shift()

        if (!valueToken) {
          throw new Error('Value token is missing')
        }

        const isTrue = operatorToken.value === '=' && valueToken.value === 'true'
        const isFalse = operatorToken.value === '=' && valueToken.value === 'false'
        const isExists = operatorToken.value === '!=' && valueToken.value === 'null'
        const isNotExists = operatorToken.value === '=' && valueToken.value === 'null'

        if (conditionType === 'event') {
          nodes.push({
            type: 'event',
            operator: operatorToken.value as Operator,
            value: String(getTokenValue(valueToken))
          })
        } else if (conditionType === 'event-type') {
          nodes.push({
            type: 'event-type',
            operator: operatorToken.value as Operator,
            value: String(getTokenValue(valueToken))
          })
        } else if (conditionType === 'name') {
          if (isExists) {
            nodes.push({
              type: 'name',
              operator: 'exists'
            })
          } else if (isNotExists) {
            nodes.push({
              type: 'name',
              operator: 'not_exists'
            })
          } else {
            nodes.push({
              type: 'name',
              operator: operatorToken.value as Operator,
              value: String(getTokenValue(valueToken))
            })
          }
        } else if (conditionType === 'userId') {
          if (isExists) {
            nodes.push({
              type: 'userId',
              operator: 'exists'
            })
          } else if (isNotExists) {
            nodes.push({
              type: 'userId',
              operator: 'not_exists'
            })
          } else if (isTrue) {
            nodes.push({
              type: 'userId',
              operator: 'is_true'
            })
          } else if (isFalse) {
            nodes.push({
              type: 'userId',
              operator: 'is_false'
            })
          } else {
            nodes.push({
              type: 'userId',
              operator: operatorToken.value as Operator,
              value: String(getTokenValue(valueToken))
            })
          }
        } else if (conditionType === 'event-property') {
          if (isExists) {
            nodes.push({
              type: 'event-property',
              name: token.value.replace(/^(properties)\./, ''),
              operator: 'exists'
            })
          } else if (isNotExists) {
            nodes.push({
              type: 'event-property',
              name: token.value.replace(/^(properties)\./, ''),
              operator: 'not_exists'
            })
          } else if (isTrue) {
            nodes.push({
              type: 'event-property',
              name: token.value.replace(/^(properties)\./, ''),
              operator: 'is_true'
            })
          } else if (isFalse) {
            nodes.push({
              type: 'event-property',
              name: token.value.replace(/^(properties)\./, ''),
              operator: 'is_false'
            })
          } else {
            nodes.push({
              type: 'event-property',
              name: token.value.replace(/^(properties)\./, ''),
              operator: operatorToken.value as Operator,
              value: getTokenValue(valueToken)
            })
          }
        } else if (conditionType === 'event-trait') {
          if (isExists) {
            nodes.push({
              type: 'event-trait',
              name: token.value.replace(/^(traits)\./, ''),
              operator: 'exists'
            })
          } else if (isNotExists) {
            nodes.push({
              type: 'event-trait',
              name: token.value.replace(/^(traits)\./, ''),
              operator: 'not_exists'
            })
          } else if (isTrue) {
            nodes.push({
              type: 'event-trait',
              name: token.value.replace(/^(traits)\./, ''),
              operator: 'is_true'
            })
          } else if (isFalse) {
            nodes.push({
              type: 'event-trait',
              name: token.value.replace(/^(traits)\./, ''),
              operator: 'is_false'
            })
          } else {
            nodes.push({
              type: 'event-trait',
              name: token.value.replace(/^(traits)\./, ''),
              operator: operatorToken.value as Operator,
              value: getTokenValue(valueToken)
            })
          }
        } else if (conditionType === 'event-context') {
          if (isExists) {
            nodes.push({
              type: 'event-context',
              name: token.value.replace(/^(context)\./, ''),
              operator: 'exists'
            })
          } else if (isNotExists) {
            nodes.push({
              type: 'event-context',
              name: token.value.replace(/^(context)\./, ''),
              operator: 'not_exists'
            })
          } else if (isTrue) {
            nodes.push({
              type: 'event-context',
              name: token.value.replace(/^(context)\./, ''),
              operator: 'is_true'
            })
          } else if (isFalse) {
            nodes.push({
              type: 'event-context',
              name: token.value.replace(/^(context)\./, ''),
              operator: 'is_false'
            })
          } else {
            nodes.push({
              type: 'event-context',
              name: token.value.replace(/^(context)\./, ''),
              operator: operatorToken.value as Operator,
              value: getTokenValue(valueToken)
            })
          }
        }
      }

      if (isFqlFunction(token)) {
        parseFqlFunction(token.value, nodes, tokens)
      }
    }

    if (token.type === 'operator' && token.value === '!') {
      if (isFqlFunction(tokens[0])) {
        const name = tokens[0].value
        tokens.shift()
        parseFqlFunction(name, nodes, tokens, { negate: true })
      }
    }

    if (token.type === 'parenleft') {
      const groupTokens: Token[] = []
      let groupToken = tokens.shift()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      while (groupToken!.type !== 'parenright') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        groupTokens.push(groupToken!)
        groupToken = tokens.shift()
      }

      groupTokens.push({ type: TokenType.EOS, value: 'eos' })
      nodes.push(parse(groupTokens))
    }

    if (token.type === 'conditional') {
      operator = token.value
    }

    token = tokens.shift()
  }

  if (nodes.length > 1) {
    return {
      type: 'group',
      operator: operator as GroupConditionOperator,
      children: nodes
    }
  }

  return nodes[0]
}

const normalize = (tokens: Token[]): Token[] => {
  const normalizedTokens: Token[] = []
  let index = 0

  while (tokens[index]) {
    const last = normalizedTokens[normalizedTokens.length - 1]
    const current = tokens[index]
    const next = tokens[index + 1]

    if (last?.type === 'ident' && current.type === 'dot' && next?.type === 'ident') {
      const previous = normalizedTokens.pop()
      normalizedTokens.push({
        type: TokenType.Ident,
        value: `${previous?.value}${current.value}${next.value}`
      })

      index += 2
    } else {
      normalizedTokens.push(tokens[index])
      index++
    }
  }

  return normalizedTokens
}

const parseFql = (fql: string): Subscription => {
  try {
    const ast = parse(normalize(lex(fql).tokens))

    if (ast.type !== 'group') {
      return {
        type: 'group',
        operator: 'and',
        children: [ast]
      }
    }

    return ast
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(`Error while parsing ${fql}`)
    return {
      error: err
    }
  }
}

export default parseFql
