const { log } = require('../common-services/general/logger.js');
const { customResponse } = require('../common-services/general/response.js');
const { middleware } = require('../common-services/general/middleware.js');
const { findByModelKeysValues, deleteModelData, getRowCountByModel } = require('./data/query.js');
const { checkIfActorHasPerms } = require('./auth/auth.helper.js');
const constants = require('../config/constants.js');
const { modelMapping } = require('./data/query.js');
const { sendEmailQueueConsumerProcessing } = require('./common.delegate.js');
const { getConstants, getModelFields, getAllModelFields } = require('./common.helper.js');
const { getKey } = require('./aws/redis/redis.js');
const { generatePresignedUrl } = require('./aws/s3/bucket.js');

const defaultPermissions = constants.MODEL_DEFAULTS.PERMISSIONS;

async function getDataHandler(rawEvent, rawContext) {
    try {
        let { event, context } = await middleware(rawEvent, rawContext);
        let success = false;
        let filter = event.pathParameters.id === 'all' ? {} : { id: parseInt(event.pathParameters.id) };
        const otherFilters = event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0 ? event.queryStringParameters : {};
        const otherParams = { rawResponse: event.queryStringParameters && event.queryStringParameters.raw === 'true' };
        if (otherFilters.page && otherFilters.perPage) {
            otherParams.limit = parseInt(otherFilters.perPage);
            otherParams.offset = (parseInt(otherFilters.page) - 1) * parseInt(otherFilters.perPage);
        }
        if (otherFilters.attributes) {
            otherParams.attributes = JSON.parse(otherFilters.attributes);
        }
        if (otherFilters.group) {
            otherParams.group = JSON.parse(otherFilters.group);
        }
        const deleteFromOtherFilters = ['raw', 'perPage', 'page', 'order', 'attributes', 'group'];
        for (let key of deleteFromOtherFilters) delete otherFilters[key];
        const dbResponse = await findByModelKeysValues(event.pathParameters.model, { ...filter, ...otherFilters }, otherParams);
        if (dbResponse && dbResponse.length > 0) {
            success = true;
        }
        let data;
        if (event.pathParameters.model === constants.MODEL_DEFAULTS.UNIQUE_KEYS.USERS) {
            for (let row of dbResponse) {
                row.password = null;
            }
        }
        if (Object.keys(filter).length > 0) {
            data = dbResponse[0];
        } else {
            data = dbResponse;
        }
        if (event.pathParameters.id === 'all') {
            let rows = JSON.parse(JSON.stringify(data));
            data = {};
            data.pages = Math.ceil((await getRowCountByModel(event.pathParameters.model)) / otherParams.limit);
            data.data = rows;
        }
        return customResponse({ data, success, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'getDataHandler' });
        return customResponse({ error });
    }
};

async function deleteDataHandler(rawEvent, rawContext) {
    let success = false;
    let allowDelete = ['grades', 'stages', 'eligibilities', 'applications', 'questions', 'responses', 'question-responses'];
    try {
        let { event, context } = await middleware(rawEvent, rawContext);
        let model = event.pathParameters.model;
        const requesterDetails = event.customFields.userDetails;
        if (!checkIfActorHasPerms(requesterDetails, modelMapping[model].name.toUpperCase(), defaultPermissions.DELETE) && !allowDelete.includes(model)) {
            throw Error('You cannot delete this entity');
        }
        const dbResponse = await deleteModelData(model, { id: event.pathParameters.id });
        if (dbResponse > 0) {
            success = true;
        }
        return customResponse({ data: dbResponse, success: true, statusCode: 200, message: `${modelMapping[model].name} deleted successfully!` });
    } catch (error) {
        log({ error, source: 'deleteDataHandler' });
        return customResponse({ error });
    }
};

async function sendEmailQueueConsumerHandler(queueEvent) {
    try {
        log({ message: 'sendEmailQueueConsumerHandler receives data', data: queueEvent });
        for (let record of queueEvent.Records) {
            const data = JSON.parse(record.body);
            const response = await sendEmailQueueConsumerProcessing(data);
        }
        return true;
    } catch (error) {
        log({ error, source: 'sendEmailQueueConsumerHandler' });
        return false;
    }
};

async function getConstantsHandler() {
    try {
        let constantsForReact = getConstants();
        return customResponse({ data: constantsForReact, success: true, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'getConstantsHandler' });
        return false;
    }
}

async function preRenderApiHandler(rawEvent, rawContext) {
    try {
        let { event, context } = await middleware(rawEvent, rawContext);
        const requesterDetails = event.customFields.userDetails;
        return customResponse({ data: { user: requesterDetails }, success: true, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'preRenderApiHandler' });
        return customResponse({ data: { constants: [], user: {} }, success: false, statusCode: 200 });
    }
}

async function getModelFieldsHandler(event, context) {
    try {
        let model = event.pathParameters.model;
        let operationType = event.pathParameters.type;
        let attributes = getModelFields(model, operationType);
        return customResponse({ data: attributes, success: true, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'getCreateFields' });
        return customResponse({ data: [], success: false, statusCode: 200 });
    }
}

async function preDeployApiHandler(rawEvent, rawContext) {
    try {
        const constants = getConstants();
        constants.FORM_FIELDS = getAllModelFields(['CREATE', 'UPDATE']);
        return customResponse({ data: { constants }, success: true, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'preRenderApiHandler' });
        return customResponse({ data: { constants: [], user: {} }, success: false, statusCode: 200 });
    }
}

async function getRedisData(rawEvent, rawContext) {
    try {
        const key = rawEvent.pathParameters.key;
        const data = await getKey(key);
        return customResponse({ data, success: true, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'getRedisKey' });
        return customResponse({ data: null, success: false, statusCode: 200 });
    }
}

async function getS3Link(rawEvent, rawContext) {
    try {
        const key = rawEvent.body.s3Key;
        const data = await generatePresignedUrl(null, 3600, key, constants.AWS.S3.PRIVATE_BUCKET_NAME);
        return customResponse({ data: { s3Link: data }, success: true, statusCode: 200 });
    } catch (error) {
        log({ error, source: 'getS3Link' });
        return customResponse({ data: null, success: false, statusCode: 200 });
    }
}

module.exports = { getDataHandler, deleteDataHandler, sendEmailQueueConsumerHandler, getConstantsHandler, preRenderApiHandler, getModelFieldsHandler, preDeployApiHandler, getRedisData, getS3Link };