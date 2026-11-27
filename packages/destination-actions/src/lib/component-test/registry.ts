// Every onboarded destination's suites. Onboarding a destination adds one import here; nothing is
// discovered by scanning folders.
import type { CTSuite } from './types'
import { suites as mixpanel } from '../../destinations/mixpanel/__component-test__'
import { suites as webhook } from '../../destinations/webhook/__component-test__'

export const suites: CTSuite[] = [...mixpanel, ...webhook]
