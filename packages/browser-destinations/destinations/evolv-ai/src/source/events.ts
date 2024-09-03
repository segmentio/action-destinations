import { evolvWrapper } from '../wrapper'
import { Allocation } from '../types'

export async function prepareEvent(event: Allocation) {
  const experimentName = await getExperimentName(event)
  return {
    ...event,
    experiment_name: experimentName
  }
}

async function getExperimentName(event: Allocation) {
  const cid = event.cid
  if (!cid) return ''

  const eid = cid.split(':')[1]
  return evolvWrapper.client.getDisplayName(eid)
}
