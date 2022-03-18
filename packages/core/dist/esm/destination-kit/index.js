import { validate, parseFql } from '@segment/destination-subscriptions';
import { Action } from './action';
import { time, duration } from '../time';
import { fieldsToJsonSchema } from './fields-to-jsonschema';
import createRequestClient from '../create-request-client';
import { validateSchema } from '../schema-validation';
import { IntegrationError, InvalidAuthenticationError } from '../errors';
import { getAuthData, getOAuth2Data, updateOAuthSettings } from './parse-settings';
import { retry } from '../retry';
export { fieldsToJsonSchema };
const OAUTH2_SCHEME = 'oauth2';
export class Destination {
    constructor(destination) {
        this.definition = destination;
        this.name = destination.name;
        this.extendRequest = destination.extendRequest;
        this.actions = {};
        this.authentication = destination.authentication;
        this.responses = [];
        if (this.definition.onDelete) {
            this.onDelete = this._onDelete;
        }
        if (this.authentication?.fields) {
            this.settingsSchema = fieldsToJsonSchema(this.authentication.fields);
        }
        for (const action of Object.keys(destination.actions)) {
            this.partnerAction(action, destination.actions[action]);
        }
    }
    validateSettings(settings) {
        if (this.settingsSchema) {
            try {
                validateSchema(settings, this.settingsSchema, { schemaKey: `${this.name}:settings` });
            }
            catch (err) {
                const error = err;
                if (error.name === 'AggregateAjvError' || error.name === 'ValidationError') {
                    error.status = 400;
                }
                throw error;
            }
        }
    }
    async testAuthentication(settings) {
        const destinationSettings = this.getDestinationSettings(settings);
        const auth = getAuthData(settings);
        const data = { settings: destinationSettings, auth };
        const context = { settings: destinationSettings, payload: undefined, auth };
        this.validateSettings(destinationSettings);
        if (!this.authentication?.testAuthentication) {
            return;
        }
        const options = this.extendRequest?.(context) ?? {};
        const requestClient = createRequestClient(options);
        try {
            await this.authentication.testAuthentication(requestClient, data);
        }
        catch (error) {
            const statusCode = error?.response?.status ?? '';
            throw new Error(`Credentials are invalid: ${statusCode} ${error.message}`);
        }
    }
    refreshAccessToken(settings, oauthData) {
        if (this.authentication?.scheme !== OAUTH2_SCHEME) {
            throw new IntegrationError('refreshAccessToken is only valid with oauth2 authentication scheme', 'NotImplemented', 501);
        }
        const context = {
            settings,
            payload: undefined,
            auth: getAuthData(settings)
        };
        const options = this.extendRequest?.(context) ?? {};
        const requestClient = createRequestClient(options);
        if (!this.authentication?.refreshAccessToken) {
            return undefined;
        }
        return this.authentication.refreshAccessToken(requestClient, { settings, auth: oauthData });
    }
    partnerAction(slug, definition) {
        const action = new Action(this.name, definition, this.extendRequest);
        action.on('response', (response) => {
            if (response) {
                this.responses.push(response);
            }
        });
        this.actions[slug] = action;
        return this;
    }
    async executeAction(actionSlug, { event, mapping, settings, auth }) {
        const action = this.actions[actionSlug];
        if (!action) {
            return [];
        }
        return action.execute({
            mapping,
            data: event,
            settings,
            auth
        });
    }
    async executeBatch(actionSlug, { events, mapping, settings, auth }) {
        const action = this.actions[actionSlug];
        if (!action) {
            return [];
        }
        await action.executeBatch({
            mapping,
            data: events,
            settings,
            auth
        });
        return [{ output: 'successfully processed batch of events' }];
    }
    async onSubscription(subscription, events, settings, auth, onComplete) {
        const subscriptionStartedAt = time();
        const actionSlug = subscription.partnerAction;
        const input = {
            mapping: subscription.mapping || {},
            settings,
            auth
        };
        let results = null;
        try {
            if (!subscription.subscribe || typeof subscription.subscribe !== 'string') {
                results = [{ output: 'invalid subscription' }];
                return results;
            }
            const parsedSubscription = parseFql(subscription.subscribe);
            if (parsedSubscription.error) {
                results = [{ output: `invalid subscription : ${parsedSubscription.error.message}` }];
                return results;
            }
            const isBatch = Array.isArray(events);
            const allEvents = (isBatch ? events : [events]);
            const subscribedEvents = allEvents.filter((event) => validate(parsedSubscription, event));
            if (subscribedEvents.length === 0) {
                results = [{ output: 'not subscribed' }];
                return results;
            }
            else if (isBatch) {
                return await this.executeBatch(actionSlug, { ...input, events: subscribedEvents });
            }
            else {
                return await this.executeAction(actionSlug, { ...input, event: subscribedEvents[0] });
            }
        }
        catch (err) {
            const error = err;
            results = [{ error: { message: error.message } }];
            if (error.name === 'AggregateAjvError' || error.name === 'ValidationError') {
                error.status = 400;
            }
            throw error;
        }
        finally {
            const subscriptionEndedAt = time();
            const subscriptionDuration = duration(subscriptionStartedAt, subscriptionEndedAt);
            onComplete?.({
                duration: subscriptionDuration,
                destination: this.name,
                action: actionSlug,
                subscribe: subscription.subscribe,
                input: {
                    data: events,
                    mapping: input.mapping,
                    settings: input.settings
                },
                output: results
            });
        }
    }
    onEvent(event, settings, options) {
        return this.onSubscriptions(event, settings, options);
    }
    onBatch(events, settings, options) {
        return this.onSubscriptions(events, settings, options);
    }
    async _onDelete(event, settings, options) {
        const { userId, anonymousId } = event;
        const payload = { userId, anonymousId };
        const destinationSettings = this.getDestinationSettings(settings);
        this.validateSettings(destinationSettings);
        const auth = getAuthData(settings);
        const data = { payload, settings: destinationSettings, auth };
        const context = { settings: destinationSettings, payload: undefined, auth };
        const opts = this.extendRequest?.(context) ?? {};
        const requestClient = createRequestClient(opts);
        const run = async () => {
            const deleteResult = await this.definition.onDelete?.(requestClient, data);
            const result = deleteResult ?? { output: 'no onDelete defined' };
            return result;
        };
        const onFailedAttempt = async (error) => {
            const statusCode = error?.status ?? error?.response?.status ?? 500;
            if (!(statusCode === 401 && this.authentication?.scheme === OAUTH2_SCHEME)) {
                throw error;
            }
            const oauthSettings = getOAuth2Data(settings);
            const newTokens = await this.refreshAccessToken(destinationSettings, oauthSettings);
            if (!newTokens) {
                throw new InvalidAuthenticationError('Failed to refresh access token');
            }
            settings = updateOAuthSettings(settings, newTokens);
            options?.onTokenRefresh?.(newTokens);
        };
        return await retry(run, { retries: 2, onFailedAttempt });
    }
    async onSubscriptions(data, settings, options) {
        const subscriptions = this.getSubscriptions(settings);
        const destinationSettings = this.getDestinationSettings(settings);
        this.validateSettings(destinationSettings);
        const run = async () => {
            const authData = getAuthData(settings);
            const promises = subscriptions.map((subscription) => this.onSubscription(subscription, data, destinationSettings, authData, options?.onComplete));
            const results = await Promise.all(promises);
            return [].concat(...results);
        };
        const onFailedAttempt = async (error) => {
            const statusCode = error?.status ?? error?.response?.status ?? 500;
            if (!(statusCode === 401 && this.authentication?.scheme === OAUTH2_SCHEME)) {
                throw error;
            }
            const oauthSettings = getOAuth2Data(settings);
            const newTokens = await this.refreshAccessToken(destinationSettings, oauthSettings);
            if (!newTokens) {
                throw new InvalidAuthenticationError('Failed to refresh access token');
            }
            settings = updateOAuthSettings(settings, newTokens);
            options?.onTokenRefresh?.(newTokens);
        };
        return await retry(run, { retries: 2, onFailedAttempt });
    }
    getSubscriptions(settings) {
        const { subscription, subscriptions } = settings;
        let parsedSubscriptions;
        if (subscription) {
            parsedSubscriptions = [subscription];
        }
        else if (Array.isArray(subscriptions)) {
            parsedSubscriptions = subscriptions;
        }
        else {
            parsedSubscriptions = [];
        }
        return parsedSubscriptions;
    }
    getDestinationSettings(settings) {
        const { subcription, subscriptions, oauth, ...otherSettings } = settings;
        return otherSettings;
    }
}
//# sourceMappingURL=index.js.map