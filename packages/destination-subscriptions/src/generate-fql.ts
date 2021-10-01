import {
	Subscription,
	GroupCondition,
	EventTypeCondition,
	EventCondition,
	EventPropertyCondition,
	EventTraitCondition,
	EventContextCondition,
	EventUserIdCondition,
	EventNameCondition,
	Operator,
	ErrorCondition
} from './types'

const stringifyValue = (
	value: string | boolean | number | undefined
): string => {
	if (typeof value === 'boolean' || typeof value === 'number') {
		return String(value)
	}

	return `"${value}"`
}

const fqlExpression = (
	name: string,
	operator: Operator,
	value: string | boolean | number | undefined
): string => {
	switch (operator) {
		case 'contains':
			return `contains(${name}, ${stringifyValue(value)})`
		case 'not_contains':
			return `!contains(${name}, ${stringifyValue(value)})`
		case 'exists':
			return `${name} != null`
		case 'not_exists':
			return `${name} = null`
		case 'starts_with':
			return `match(${name}, "${String(value)}*")`
		case 'not_starts_with':
			return `!match(${name}, "${String(value)}*")`
		case 'ends_with':
			return `match(${name}, "*${String(value)}")`
		case 'not_ends_with':
			return `!match(${name}, "*${String(value)}")`
		case '<':
		case '>':
		case '<=':
		case '>=':
			return `${name} ${operator} ${Number(value)}`
		default:
			return `${name} ${operator} ${stringifyValue(value)}`
	}
}

const stringifyGroupNode = (node: GroupCondition): string => {
	return node.children
		.map(childNode => {
			if (childNode.type === 'group') {
				return `(${stringifyGroupNode(childNode)})`
			}

			return stringifyChildNode(childNode)
		})
		.join(` ${node.operator} `)
}

const stringifyChildNode = (
	node:
		| EventTypeCondition
		| EventCondition
		| EventPropertyCondition
		| EventTraitCondition
		| EventContextCondition
		| EventUserIdCondition
		| EventNameCondition
): string => {
	let result = ''

	switch (node.type) {
		case 'name':
		case 'userId':
		case 'event': {
			result += fqlExpression(node.type, node.operator, node.value)
			break
		}

		case 'event-type': {
			result += fqlExpression('type', node.operator, node.value)
			break
		}

		case 'event-property': {
			result += fqlExpression(
				`properties.${node.name}`,
				node.operator,
				node.value
			)
			break
		}

		case 'event-trait': {
			result += fqlExpression(`traits.${node.name}`, node.operator, node.value)
			break
		}

		case 'event-context': {
			result += fqlExpression(`context.${node.name}`, node.operator, node.value)
			break
		}

		default:
			throw new Error('Unknown condition type')
	}

	return result
}

const numberOfParens = (string: string): number => {
	let parens = 0

	for (const char of string.split('')) {
		if (char === '(' || char === ')') {
			parens++
		}
	}

	return parens
}

const generateFql = (ast: Subscription): string => {
	if ((ast as ErrorCondition).error) {
		throw (ast as ErrorCondition).error
	}

	const fql = stringifyGroupNode(ast as GroupCondition)

	if (fql.startsWith('(') && fql.endsWith(')') && numberOfParens(fql) === 2) {
		return fql.slice(1, -1)
	}

	return fql
}

export default generateFql
