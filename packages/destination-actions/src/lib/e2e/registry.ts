// Every onboarded destination's suites. Onboarding a destination adds one import here; nothing is
// discovered by scanning folders.
import type { E2ESuite } from './types'
import { suites as braze } from '../../destinations/braze/__e2e__'
import { suites as mixpanel } from '../../destinations/mixpanel/__e2e__'
import { suites as webhook } from '../../destinations/webhook/__e2e__'

export const suites: E2ESuite[] = [...braze, ...mixpanel, ...webhook]
