import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DynamicFieldItem, DynamicFieldResponse } from '@segment/actions-core'
import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { HTTPError } from '@segment/actions-core'


export async function getSurveys(
  request: RequestClient
): Promise<DynamicFieldResponse> {
  const choices: DynamicFieldItem[] = [];
  try {
    let has_next_page = false;
    let page = 1;
    do {
      const response = await request(`https://api.surveysparrow.com/v3/surveys?page=${page}`, {
        method: 'get'
      });
      const data = JSON.parse(response.content);
      const surveys = data.data;
      for (const survey of surveys) {
        choices.push({
          label: `${survey.name}`,
          value: survey.id
        })
      }
      page++;
      has_next_page = data.has_next_page;
    } while (has_next_page);
  } catch (err) {
    return getError(err)
  }
  return {
    choices
  }
}

async function getError(err: unknown) {
  const errResponse = (err as HTTPError)?.response
  const errorBody = (await errResponse.json())
  return {
    choices: [],
    error: {
      message: errorBody?.meta?.error?.errorMessage ?? 'Unknown Error',
      code: errResponse?.status.toString() ?? '500'
    }
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Survey in SurveySparrow',
  defaultSubscription: 'type=track and event="Trigger Survey"',
  description: 'This Action will send out SurveySparrow survey to specific user through Email, SMS or WhatsApp. The [survey](https://support.surveysparrow.com/hc/en-us/articles/7079412445213-How-to-create-surveys-using-SurveySparrow) and required share [channel](https://support.surveysparrow.com/hc/en-us/articles/7078359450269-How-to-share-surveys-across-different-channels) should be created in SurveySparrow.',
  fields: {
    id: {
      label: 'Channel ID',
      type: 'number',
      required: true,
      description: 'Channel ID is the unique identifier for the Share Channel in SurveySparrow. This can be copied from the URL.',
      default: {
        '@path': '$.properties.channel_id'
      }
    },
    share_type: {
      label: 'Share Type',
      type: 'string',
      required: true,
      description: 'Type of Survey Share to be triggered',
      choices: [
        {
          label: 'Email',
          value: 'Email'
        },
        {
          label: 'SMS',
          value: 'SMS'
        },
        {
          label: 'WhatsApp',
          value: 'WhatsApp'
        }
      ],
      default: {
        '@path': '$.properties.share_type'
      }
    },
    survey_id: {
      label: 'Survey',
      type: 'number',
      required: true,
      description: 'Select the SurveySparrow Survey you want to trigger',
      dynamic: true,
      default: {
        '@path': '$.properties.survey_id'
      }
    },
    mobile: {
      label: 'Mobile',
      type: 'string',
      description: 'Mobile number to trigger survey through SMS or WhatsApp. This should include + followed by Country Code. For Example, +18004810410 (Required for SMS or WhatsApp share)',
      default: {
        '@path': '$.properties.mobile'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email address to trigger survey through Email (Required for Email share)',
      default: {
        '@path': '$.properties.email'
      }
    },
    variables: {
      label: 'Variables',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      description: 'Variables you want to pass to SurveySparrow.',
      default: {
        '@path': '$.properties.variables'
      }
    }
  },
  dynamicFields: {
    survey_id: getSurveys
  },
  perform: (request, data) => {
    switch (data.payload.share_type) {
      case 'Email': {
        if (!data.payload.email) {
          throw new PayloadValidationError('Email is Required Field Email Share');
        }
        else break;
      }
      case 'SMS':
      case 'WhatsApp': {
        if (!data.payload.mobile) {
          throw new PayloadValidationError(`Mobile is Required Field for ${data.payload.share_type} Share`);
        }
        else break;
      }
      default: throw new PayloadValidationError(`Wrong Share Type`);
    }
    let payload = {
      survey_id: data.payload.survey_id,
      contacts: [{
        email: data.payload.email,
        mobile: data.payload.mobile
      }],
      variables: data.payload.variables
    }
    return request(`https://api.surveysparrow.com/v3/channels/${data.payload.id}`, {
      method: 'put',
      json: payload
    });
  }
}

export default action
