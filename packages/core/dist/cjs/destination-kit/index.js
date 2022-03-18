"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Destination = exports.fieldsToJsonSchema = void 0;
const destination_subscriptions_1 = require("@segment/destination-subscriptions");
const action_1 = require("./action");
const time_1 = require("../time");
const fields_to_jsonschema_1 = require("./fields-to-jsonschema");
Object.defineProperty(exports, "fieldsToJsonSchema", { enumerable: true, get: function () { return fields_to_jsonschema_1.fieldsToJsonSchema; } });
const create_request_client_1 = __importDefault(require("../create-request-client"));
const schema_validation_1 = require("../schema-validation");
const errors_1 = require("../errors");
const parse_settings_1 = require("./parse-settings");
const retry_1 = require("../retry");
const OAUTH2_SCHEME = 'oauth2';
class Destination {
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
            this.settingsSchema = fields_to_jsonschema_1.fieldsToJsonSchema(this.authentication.fields);
        }
        for (const action of Object.keys(destination.actions)) {
            this.partnerAction(action, destination.actions[action]);
        }
    }
    validateSettings(settings) {
        if (this.settingsSchema) {
            try {
                schema_validation_1.validateSchema(settings, this.settingsSchema, { schemaKey: `${this.name}:settings` });
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
        const auth = parse_settings_1.getAuthData(settings);
        const data = { settings: destinationSettings, auth };
        const context = { settings: destinationSettings, payload: undefined, auth };
        this.validateSettings(destinationSettings);
        if (!this.authentication?.testAuthentication) {
            return;
        }
        const options = this.extendRequest?.(context) ?? {};
        const requestClient = create_request_client_1.default(options);
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
            throw new errors_1.IntegrationError('refreshAccessToken is only valid with oauth2 authentication scheme', 'NotImplemented', 501);
        }
        const context = {
            settings,
            payload: undefined,
            auth: parse_settings_1.getAuthData(settings)
        };
        const options = this.extendRequest?.(context) ?? {};
        const requestClient = create_request_client_1.default(options);
        if (!this.authentication?.refreshAccessToken) {
            return undefined;
        }
        return this.authentication.refreshAccessToken(requestClient, { settings, auth: oauthData });
    }
    partnerAction(slug, definition) {
        const action = new action_1.Action(this.name, definition, this.extendRequest);
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
        const subscriptionStartedAt = time_1.time();
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
            const parsedSubscription = destination_subscriptions_1.parseFql(subscription.subscribe);
            if (parsedSubscription.error) {
                results = [{ output: `invalid subscription : ${parsedSubscription.error.message}` }];
                return results;
            }
            const isBatch = Array.isArray(events);
            const allEvents = (isBatch ? events : [events]);
            const subscribedEvents = allEvents.filter((event) => destination_subscriptions_1.validate(parsedSubscription, event));
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
            const subscriptionEndedAt = time_1.time();
            const subscriptionDuration = time_1.duration(subscriptionStartedAt, subscriptionEndedAt);
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
        const auth = parse_settings_1.getAuthData(settings);
        const data = { payload, settings: destinationSettings, auth };
        const context = { settings: destinationSettings, payload: undefined, auth };
        const opts = this.extendRequest?.(context) ?? {};
        const requestClient = create_request_client_1.default(opts);
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
            const oauthSettings = parse_settings_1.getOAuth2Data(settings);
            const newTokens = await this.refreshAccessToken(destinationSettings, oauthSettings);
            if (!newTokens) {
                throw new errors_1.InvalidAuthenticationError('Failed to refresh access token');
            }
            settings = parse_settings_1.updateOAuthSettings(settings, newTokens);
            options?.onTokenRefresh?.(newTokens);
        };
        return await retry_1.retry(run, { retries: 2, onFailedAttempt });
    }
    async onSubscriptions(data, settings, options) {
        const subscriptions = this.getSubscriptions(settings);
        const destinationSettings = this.getDestinationSettings(settings);
        this.validateSettings(destinationSettings);
        const run = async () => {
            const authData = parse_settings_1.getAuthData(settings);
            const promises = subscriptions.map((subscription) => this.onSubscription(subscription, data, destinationSettings, authData, options?.onComplete));
            const results = await Promise.all(promises);
            return [].concat(...results);
        };
        const onFailedAttempt = async (error) => {
            const statusCode = error?.status ?? error?.response?.status ?? 500;
            if (!(statusCode === 401 && this.authentication?.scheme === OAUTH2_SCHEME)) {
                throw error;
            }
            const oauthSettings = parse_settings_1.getOAuth2Data(settings);
            const newTokens = await this.refreshAccessToken(destinationSettings, oauthSettings);
            if (!newTokens) {
                throw new errors_1.InvalidAuthenticationError('Failed to refresh access token');
            }
            settings = parse_settings_1.updateOAuthSettings(settings, newTokens);
            options?.onTokenRefresh?.(newTokens);
        };
        return await retry_1.retry(run, { retries: 2, onFailedAttempt });
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
exports.Destination = Destination;
//# sourceMappingURL=index.js.map