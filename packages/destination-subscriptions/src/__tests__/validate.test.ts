import { validate as originalValidate } from '../index'

// Helper to avoid caring about types in tests
const validate = (ast: any, data: any): boolean => originalValidate(ast, data)

test('should handle error in ast', () => {
	const ast = {
		error: new Error("Cannot read property 'type' of undefined")
	}

	expect(validate(ast, { properties: { value: 'x' } })).toEqual(false)
})

test('should handle undefined event', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: '=',
				value: 'x'
			}
		]
	}

	expect(validate(ast, undefined)).toEqual(false)
})

test('should handle empty string as event', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: '=',
				value: 'x'
			}
		]
	}

	expect(validate(ast, '')).toEqual(false)
})

test('should handle empty event', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: '=',
				value: 'x'
			}
		]
	}

	expect(validate(ast, {})).toEqual(false)
})

test('operators - equals (strings)', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: '=',
				value: 'x'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'x' } })).toEqual(true)
	expect(validate(ast, { properties: { value: 'y' } })).toEqual(false)
})

test('operators - equals (numbers)', () => {
	for (const value of ['123', 123]) {
		const ast = {
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event-property',
					name: 'value',
					operator: '=',
					value
				}
			]
		}

		expect(validate(ast, { properties: { value: 123 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '123' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 0 } })).toEqual(false)
	}
})

test('operators - not equals (strings)', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: '!=',
				value: 'x'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'x' } })).toEqual(false)
	expect(validate(ast, { properties: { value: 'y' } })).toEqual(true)
})

test('operators - not equals (numbers)', () => {
	for (const value of ['123', 123]) {
		const ast = {
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event-property',
					name: 'value',
					operator: '!=',
					value
				}
			]
		}

		expect(validate(ast, { properties: { value: 123 } })).toEqual(false)
		expect(validate(ast, { properties: { value: '123' } })).toEqual(false)
		expect(validate(ast, { properties: { value: 456 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '456' } })).toEqual(true)
	}
})

test('operators - less than', () => {
	for (const value of ['10', 10]) {
		const ast = {
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event-property',
					name: 'value',
					operator: '<',
					value
				}
			]
		}

		expect(validate(ast, { properties: { value: 5 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '5' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 10 } })).toEqual(false)
		expect(validate(ast, { properties: { value: '10' } })).toEqual(false)
	}
})

test('operators - less than or equal', () => {
	for (const value of ['10', 10]) {
		const ast = {
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event-property',
					name: 'value',
					operator: '<=',
					value
				}
			]
		}

		expect(validate(ast, { properties: { value: 5 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '5' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 10 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '10' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 11 } })).toEqual(false)
		expect(validate(ast, { properties: { value: '11' } })).toEqual(false)
	}
})

test('operators - greater than', () => {
	for (const value of ['10', 10]) {
		const ast = {
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event-property',
					name: 'value',
					operator: '>',
					value
				}
			]
		}

		expect(validate(ast, { properties: { value: 11 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '11' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 10 } })).toEqual(false)
		expect(validate(ast, { properties: { value: '10' } })).toEqual(false)
		expect(validate(ast, { properties: { value: 5 } })).toEqual(false)
		expect(validate(ast, { properties: { value: '5' } })).toEqual(false)
	}
})

test('operators - greater than or equal', () => {
	for (const value of ['10', 10]) {
		const ast = {
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event-property',
					name: 'value',
					operator: '>=',
					value
				}
			]
		}

		expect(validate(ast, { properties: { value: 11 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '11' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 10 } })).toEqual(true)
		expect(validate(ast, { properties: { value: '10' } })).toEqual(true)
		expect(validate(ast, { properties: { value: 5 } })).toEqual(false)
		expect(validate(ast, { properties: { value: '5' } })).toEqual(false)
	}
})

test('operators - contains', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'contains',
				value: 'b'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'abc' } })).toEqual(true)
	expect(validate(ast, { properties: { value: 'xyz' } })).toEqual(false)
})

test('operators - not contains', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'not_contains',
				value: 'b'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'abc' } })).toEqual(false)
	expect(validate(ast, { properties: { value: 'xyz' } })).toEqual(true)
})

test('operators - starts with', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'starts_with',
				value: 'x'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'xabc' } })).toEqual(true)
	expect(validate(ast, { properties: { value: 'abc' } })).toEqual(false)
})

test('operators - not starts with', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'not_starts_with',
				value: 'x'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'xabc' } })).toEqual(false)
	expect(validate(ast, { properties: { value: 'abc' } })).toEqual(true)
})

test('operators - ends with', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'ends_with',
				value: 'x'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'abcx' } })).toEqual(true)
	expect(validate(ast, { properties: { value: 'abc' } })).toEqual(false)
})

test('operators - not ends with', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'not_ends_with',
				value: 'x'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'abcx' } })).toEqual(false)
	expect(validate(ast, { properties: { value: 'abc' } })).toEqual(true)
})

test('operators - exists', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'exists'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'abcx' } })).toEqual(true)
	expect(validate(ast, { properties: {} })).toEqual(false)
	expect(validate(ast, { properties: { value: null } })).toEqual(false)
})

test('operators - not exists', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'value',
				operator: 'not_exists'
			}
		]
	}

	expect(validate(ast, { properties: { value: 'abcx' } })).toEqual(false)
	expect(validate(ast, { properties: {} })).toEqual(true)
	expect(validate(ast, { properties: { value: null } })).toEqual(true)
})

test('event type = "track"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			}
		]
	}

	expect(validate(ast, { type: 'track' })).toEqual(true)
	expect(validate(ast, { type: 'identify' })).toEqual(false)
})

test('event type = "track" or "identify"', () => {
	const ast = {
		type: 'group',
		operator: 'or',
		children: [
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			},
			{
				type: 'event-type',
				operator: '=',
				value: 'identify'
			}
		]
	}

	expect(validate(ast, { type: 'track' })).toEqual(true)
	expect(validate(ast, { type: 'identify' })).toEqual(true)
	expect(validate(ast, { type: 'group' })).toEqual(false)
})

test('event type = not "group"', () => {
	const ast = {
		type: 'group',
		operator: 'or',
		children: [
			{
				type: 'event-type',
				operator: '!=',
				value: 'group'
			}
		]
	}

	expect(validate(ast, { type: 'track' })).toEqual(true)
	expect(validate(ast, { type: 'identify' })).toEqual(true)
	expect(validate(ast, { type: 'group' })).toEqual(false)
})

test('event = "Page Viewed"', () => {
	const ast = {
		type: 'group',
		operator: 'or',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			}
		]
	}

	expect(validate(ast, { event: 'Page Viewed' })).toEqual(true)
	expect(validate(ast, { event: 'Product Added' })).toEqual(false)
})

test('event = "Page Viewed" or "Product Viewed"', () => {
	const ast = {
		type: 'group',
		operator: 'or',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'event',
				operator: '=',
				value: 'Product Viewed'
			}
		]
	}

	expect(validate(ast, { event: 'Page Viewed' })).toEqual(true)
	expect(validate(ast, { event: 'Product Viewed' })).toEqual(true)
	expect(validate(ast, { event: 'Product Added' })).toEqual(false)
})

test('event = "Page Viewed" or event type = "track"', () => {
	const ast = {
		type: 'group',
		operator: 'or',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			}
		]
	}

	expect(validate(ast, { event: 'Page Viewed' })).toEqual(true)
	expect(validate(ast, { type: 'track' })).toEqual(true)
	expect(validate(ast, { event: 'Product Added' })).toEqual(false)
})

test('event = "Page Viewed" and event type = "track"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			}
		]
	}

	expect(validate(ast, { event: 'Page Viewed' })).toEqual(false)
	expect(validate(ast, { type: 'track' })).toEqual(false)
	expect(validate(ast, { event: 'Page Viewed', type: 'track' })).toEqual(true)
})

test('event = "Page Viewed" and event property "name" = "Catalog"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: '=',
				value: 'Catalog'
			}
		]
	}

	expect(
		validate(ast, { event: 'Page Viewed', properties: { name: 'Catalog' } })
	).toEqual(true)
	expect(validate(ast, { event: 'Page Viewed' })).toEqual(false)
	expect(
		validate(ast, { event: 'Page Viewed', properties: { name: 'Other' } })
	).toEqual(false)
})

test('event = "Page Viewed" and event property "name" = "Catalog" or "Home"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'group',
				operator: 'or',
				children: [
					{
						type: 'event-property',
						name: 'name',
						operator: '=',
						value: 'Catalog'
					},
					{
						type: 'event-property',
						name: 'name',
						operator: '=',
						value: 'Home'
					}
				]
			}
		]
	}

	expect(
		validate(ast, { event: 'Page Viewed', properties: { name: 'Catalog' } })
	).toEqual(true)
	expect(
		validate(ast, { event: 'Page Viewed', properties: { name: 'Home' } })
	).toEqual(true)
	expect(
		validate(ast, { event: 'Page Viewed', properties: { name: 'Other' } })
	).toEqual(false)
})

test('event = "Page Viewed" and event context "ip" = "1.1.1.1"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'event-context',
				name: 'ip',
				operator: '=',
				value: '1.1.1.1'
			}
		]
	}

	expect(
		validate(ast, { event: 'Page Viewed', context: { ip: '1.1.1.1' } })
	).toEqual(true)
	expect(validate(ast, { event: 'Page Viewed' })).toEqual(false)
	expect(
		validate(ast, { event: 'Page Viewed', context: { ip: '8.8.8.8' } })
	).toEqual(false)
})

test('event = "Page Viewed" and event context "ip" = "1.1.1.1" or "2.2.2.2"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Page Viewed'
			},
			{
				type: 'group',
				operator: 'or',
				children: [
					{
						type: 'event-context',
						name: 'ip',
						operator: '=',
						value: '1.1.1.1'
					},
					{
						type: 'event-property',
						name: 'ip',
						operator: '=',
						value: '2.2.2.2'
					}
				]
			}
		]
	}

	expect(
		validate(ast, { event: 'Page Viewed', context: { ip: '1.1.1.1' } })
	).toEqual(true)
	expect(
		validate(ast, { event: 'Page Viewed', context: { ip: '2.2.2.2' } })
	).toEqual(false)
	expect(validate(ast, { event: 'Page Viewed' })).toEqual(false)
	expect(
		validate(ast, { event: 'Page Viewed', context: { ip: '8.8.8.8' } })
	).toEqual(false)
})

test('event type = "track" and event = "Page Viewed" or event = "Order Completed"', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			},
			{
				type: 'group',
				operator: 'or',
				children: [
					{
						type: 'event',
						operator: '=',
						value: 'Page Viewed'
					},
					{
						type: 'event',
						operator: '=',
						value: 'Order Completed'
					}
				]
			}
		]
	}

	expect(
		validate(ast, {
			type: 'track',
			event: 'Page Viewed'
		})
	).toEqual(true)
})

test('pull properties from `traits` object for "identify" and "group" events', () => {
	const ast = {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-property',
				name: 'name',
				operator: '=',
				value: 'Jane Hopper'
			}
		]
	}

	expect(
		validate(ast, { type: 'identify', traits: { name: 'Jane Hopper' } })
	).toEqual(true)
	expect(
		validate(ast, { type: 'group', traits: { name: 'Jane Hopper' } })
	).toEqual(true)
	expect(validate(ast, { event: 'Page Viewed' })).toEqual(false)
	expect(
		validate(ast, { type: 'identify', traits: { name: 'Demogorgon' } })
	).toEqual(false)
})
