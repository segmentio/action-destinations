export type Subscription = ErrorCondition | GroupCondition
export interface GroupCondition<T = Condition> {
	type: 'group'
	operator: GroupConditionOperator
	children: T[]
}

export interface ErrorCondition {
	error: Error
}

export type Condition =
	| GroupCondition
	| EventTypeCondition
	| EventCondition
	| EventPropertyCondition
	| EventTraitCondition
	| EventContextCondition
	| EventUserIdCondition
	| EventNameCondition

export type GroupConditionOperator = 'and' | 'or'

export interface EventTypeCondition {
	type: 'event-type'
	operator: Operator
	value?: string
}

export interface EventCondition {
	type: 'event'
	operator: Operator
	value?: string
}

export interface EventUserIdCondition {
	type: 'userId'
	operator: Operator
	value?: string
}

export interface EventNameCondition {
	type: 'name'
	operator: Operator
	value?: string
}

export interface EventPropertyCondition {
	type: 'event-property'
	name: string
	operator: Operator
	value?: string | boolean | number
}

export interface EventTraitCondition {
	type: 'event-trait'
	name: string
	operator: Operator
	value?: string | boolean | number
}

export interface EventContextCondition {
	type: 'event-context'
	name: string
	operator: Operator
	value?: string | boolean | number
}

export type Operator =
	| '='
	| '!='
	| '<'
	| '<='
	| '>'
	| '>='
	| 'contains'
	| 'not_contains'
	| 'starts_with'
	| 'not_starts_with'
	| 'ends_with'
	| 'not_ends_with'
	| 'exists'
	| 'not_exists'

export type ConditionType =
	| 'group'
	| 'event-type'
	| 'event'
	| 'event-property'
	| 'event-trait'
	| 'event-context'
	| 'name'
	| 'userId'

export type PropertyConditionType = 'event-property' | 'event-context'
