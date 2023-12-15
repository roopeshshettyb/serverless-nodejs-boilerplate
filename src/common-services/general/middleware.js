const { log } = require('./logger');
const { getToken } = require('../../users/user.helper');
const parser = require('lambda-multipart-parser');
const { validateTokenAndGetClaims } = require('../auth/auth.delegate');
const constants = require('../../config/constants');

async function logRequestMiddleware(event, context) {
    try {
        let data = {
            method: event.httpMethod,
            path: event.path,
            headers: event.headers,
            body: event.body
        };
        log({ data });
    } catch (error) {
        log({ error, source: 'logRequestMiddleware' });
    }
    return true;
};

async function middleware(rawEvent, rawContext) {
    let event = rawEvent;
    let context = rawContext;
    let tokenExpiryMessage = 'Your session has expired. Please login.'; // DO NOT CHANGE. IF CHANGE THEN CHANGE FRONTEND ALSO
    try {
        try {
            const contentTypeKey = constants.ENV === 'dev' ? 'Content-Type' : 'content-type';
            if (rawEvent.headers[contentTypeKey] && rawEvent.headers[contentTypeKey].includes('multipart/form-data')) {
                const result = await parser.parse(event);
                event.body = JSON.parse(result.body);
                let mappedFiles = {};
                for (let file of result.files) {
                    mappedFiles[file.filename] = file;
                }
                event.files = mappedFiles;
            } else {
                logRequestMiddleware(rawEvent, rawContext);
                event.body = JSON.parse(event.body);
            }
        } catch (error) {
            log({ error, source: 'parseEventBody' });
        }
        let token = await getToken(rawEvent);
        let userDetails;
        if (event.requestContext.authorizer) {
            userDetails = event.requestContext.authorizer.claims;
        } else {
            userDetails = await validateTokenAndGetClaims(token);
        }
        if (userDetails && userDetails.exp) {
            if (Date.now() > new Date(userDetails.exp * 1000)) {
                throw Error(tokenExpiryMessage);
            }
        }
        event.customFields = { userDetails: { ...userDetails, token } };
    } catch (error) {
        log({ error, source: 'middleware' });
        if (error.message === tokenExpiryMessage) {
            throw error;
        }
    }
    return { event, context };
};

module.exports = { middleware };
