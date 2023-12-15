const { log } = require('./logger');

function customResponse({ success = null, data, message, statusCode, error }) {
    const body = { success: false };

    try {
        if (success) body.success = success;
        if (data) body.data = data;
        if (message) body.message = message;
        if (error) body.error = error instanceof Error ? error.message : error;
        if (statusCode) {
            statusCode = statusCode;
        } else if (success) {
            statusCode = 200;
        } else {
            statusCode = 500;
        }
    } catch (err) {
        log({ error, source: 'customResponse' });
    }

    const response = {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            'Access-Control-Allow-Methods': 'GET,PUT,POST,PATCH,OPTIONS',
            "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(body),
    };
    log({
        data: response,
        message: 'API Response'
    });
    return response;
}

module.exports = { customResponse };