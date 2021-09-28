import { parseFql, generateFql } from '../index'

const testFql = (fql: string, ast: any): void => {
	expect(parseFql(fql)).toEqual(ast)
	expect(generateFql(ast)).toEqual(fql)
}

const expectedTypeError = new Error("Cannot read property 'type' of undefined")
expectedTypeError.name = 'TypeError'

test('should handle invalid payloads', () => {
	expect(parseFql('typo')).toEqual({
		error: expectedTypeError
	})
})

test('should handle incomplete payloads', () => {
	const expectedError = new Error('Value token is missing')
	expect(parseFql('type')).toEqual({
		error: expectedError
	})
})

test('should handle invalid operators', () => {
	expect(parseFql('type * "32456"')).toEqual({
		error: expectedTypeError
	})
})

test('should handle empty payload', () => {
	expect(parseFql('')).toEqual({
		error: expectedTypeError
	})
})

test('should handle missing values', () => {
	expect(parseFql('type = ')).toEqual({
		children: [
			{
				operator: '=',
				type: 'event-type',
				value: 'eos'
			}
		],
		operator: 'and',
		type: 'group'
	})
})

test('type = "track"', () => {
	testFql('type = "track"', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			}
		]
	})
})

test('type = "track" or type = "identify"', () => {
	testFql('type = "track" or type = "identify"', {
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
	})
})

test('event = "Product Added"', () => {
	testFql('event = "Product Added"', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			}
		]
	})
})

test('userId != null', () => {
	testFql('userId != null', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'userId',
				operator: 'exists'
			}
		]
	})
})

test('name = "Home"', () => {
	testFql('name = "Home"', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'name',
				operator: '=',
				value: 'Home'
			}
		]
	})
})

test('event = "Product Added" or event = "Order Completed"', () => {
	testFql('event = "Product Added" or event = "Order Completed"', {
		type: 'group',
		operator: 'or',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event',
				operator: '=',
				value: 'Order Completed'
			}
		]
	})
})

test('type = "track" and event = "Product Added"', () => {
	testFql('type = "track" and event = "Product Added"', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event-type',
				operator: '=',
				value: 'track'
			},
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			}
		]
	})
})

test('type = "track" and (event = "Product Added" or event = "Order Completed")', () => {
	testFql(
		'type = "track" and (event = "Product Added" or event = "Order Completed")',
		{
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
							value: 'Product Added'
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
	)
})

test('event = "Product Added" and property "price" >= 100', () => {
	testFql('event = "Product Added" and properties.price >= 100', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'price',
				operator: '>=',
				value: 100
			}
		]
	})
})

test('event = "identify" and traits.logins >= 10', () => {
	testFql('event = "identify" and traits.logins >= 10', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'identify'
			},
			{
				type: 'event-trait',
				name: 'logins',
				operator: '>=',
				value: 10
			}
		]
	})
})

test('event = "Product Added" and property "price" >= 100 and property "premium" = true', () => {
	testFql(
		'event = "Product Added" and properties.price >= 100 and properties.premium = "true"',
		{
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event',
					operator: '=',
					value: 'Product Added'
				},
				{
					type: 'event-property',
					name: 'price',
					operator: '>=',
					value: 100
				},
				{
					type: 'event-property',
					name: 'premium',
					operator: '=',
					value: 'true'
				}
			]
		}
	)
})

test('event = "identify" and traits "logins" >= 10 and traits "plan" = "premium"', () => {
	testFql(
		'event = "identify" and traits.logins >= 10 and traits.plan = "premium"',
		{
			type: 'group',
			operator: 'and',
			children: [
				{
					type: 'event',
					operator: '=',
					value: 'identify'
				},
				{
					type: 'event-trait',
					name: 'logins',
					operator: '>=',
					value: 10
				},
				{
					type: 'event-trait',
					name: 'plan',
					operator: '=',
					value: 'premium'
				}
			]
		}
	)
})

test('(event = "Product Added" and property "price" >= 100) or (event = "Order Completed" and property "total" >= 500)', () => {
	testFql(
		'(event = "Product Added" and properties.price >= 100) or (event = "Order Completed" and properties.total >= 500)',
		{
			type: 'group',
			operator: 'or',
			children: [
				{
					type: 'group',
					operator: 'and',
					children: [
						{
							type: 'event',
							operator: '=',
							value: 'Product Added'
						},
						{
							type: 'event-property',
							operator: '>=',
							name: 'price',
							value: 100
						}
					]
				},
				{
					type: 'group',
					operator: 'and',
					children: [
						{
							type: 'event',
							operator: '=',
							value: 'Order Completed'
						},
						{
							type: 'event-property',
							name: 'total',
							operator: '>=',
							value: 500
						}
					]
				}
			]
		}
	)
})

test('(event = "identify" and trait "logins" >= 100) or (event = "Signed Up" and trait "age" >= 50)', () => {
	testFql(
		'(event = "identify" and traits.logins >= 100) or (event = "Signed Up" and traits.age >= 50)',
		{
			type: 'group',
			operator: 'or',
			children: [
				{
					type: 'group',
					operator: 'and',
					children: [
						{
							type: 'event',
							operator: '=',
							value: 'identify'
						},
						{
							type: 'event-trait',
							operator: '>=',
							name: 'logins',
							value: 100
						}
					]
				},
				{
					type: 'group',
					operator: 'and',
					children: [
						{
							type: 'event',
							operator: '=',
							value: 'Signed Up'
						},
						{
							type: 'event-trait',
							name: 'age',
							operator: '>=',
							value: 50
						}
					]
				}
			]
		}
	)
})

test('support contains for event name', () => {
	testFql('contains(event, "Nike")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: 'contains',
				value: 'Nike'
			}
		]
	})
})

test('support contains for event property', () => {
	testFql('event = "Product Added" and contains(properties.name, "Nike")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'contains',
				value: 'Nike'
			}
		]
	})
})

test('support contains for event trait', () => {
	testFql('event = "Product Added" and contains(traits.name, "Nike")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'contains',
				value: 'Nike'
			}
		]
	})
})

test('support not_contains for event name', () => {
	testFql('!contains(event, "Nike")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: 'not_contains',
				value: 'Nike'
			}
		]
	})
})

test('support not_contains for event property', () => {
	testFql('event = "Product Added" and !contains(properties.name, "Nike")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'not_contains',
				value: 'Nike'
			}
		]
	})
})

test('support not_contains for event trait', () => {
	testFql('event = "Product Added" and !contains(traits.name, "Nike")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'not_contains',
				value: 'Nike'
			}
		]
	})
})

test('support starts_with for event name', () => {
	testFql('match(event, "X*")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: 'starts_with',
				value: 'X'
			}
		]
	})
})

test('support starts_with for event property', () => {
	testFql('event = "Product Added" and match(properties.name, "X*")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'starts_with',
				value: 'X'
			}
		]
	})
})

test('support starts_with for event trait', () => {
	testFql('event = "Product Added" and match(traits.name, "X*")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'starts_with',
				value: 'X'
			}
		]
	})
})

test('support not_starts_with for event name', () => {
	testFql('!match(event, "X*")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: 'not_starts_with',
				value: 'X'
			}
		]
	})
})

test('support not_starts_with for event property', () => {
	testFql('event = "Product Added" and !match(properties.name, "X*")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'not_starts_with',
				value: 'X'
			}
		]
	})
})

test('support not_starts_with for event property', () => {
	testFql('event = "Product Added" and !match(traits.name, "X*")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'not_starts_with',
				value: 'X'
			}
		]
	})
})

test('support ends_with for event name', () => {
	testFql('match(event, "*X")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: 'ends_with',
				value: 'X'
			}
		]
	})
})

test('support ends_with for event property', () => {
	testFql('event = "Product Added" and match(properties.name, "*X")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'ends_with',
				value: 'X'
			}
		]
	})
})

test('support ends_with for event trait', () => {
	testFql('event = "Product Added" and match(traits.name, "*X")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'ends_with',
				value: 'X'
			}
		]
	})
})

test('support not_ends_with for event name', () => {
	testFql('!match(event, "*X")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: 'not_ends_with',
				value: 'X'
			}
		]
	})
})

test('support not_ends_with for event property', () => {
	testFql('event = "Product Added" and !match(properties.name, "*X")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'not_ends_with',
				value: 'X'
			}
		]
	})
})

test('support not_ends_with for event trait', () => {
	testFql('event = "Product Added" and !match(traits.name, "*X")', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'not_ends_with',
				value: 'X'
			}
		]
	})
})

test('support exists for event property', () => {
	testFql('event = "Product Added" and properties.name != null', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'exists'
			}
		]
	})
})

test('support exists for event trait', () => {
	testFql('event = "Product Added" and traits.name != null', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'exists'
			}
		]
	})
})

test('support not_exists for event property', () => {
	testFql('event = "Product Added" and properties.name = null', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-property',
				name: 'name',
				operator: 'not_exists'
			}
		]
	})
})

test('support not_exists for event trait', () => {
	testFql('event = "Product Added" and traits.name = null', {
		type: 'group',
		operator: 'and',
		children: [
			{
				type: 'event',
				operator: '=',
				value: 'Product Added'
			},
			{
				type: 'event-trait',
				name: 'name',
				operator: 'not_exists'
			}
		]
	})
})
