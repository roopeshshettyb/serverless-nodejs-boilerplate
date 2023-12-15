const { axios } = require('axios');

async function apiRequest({ method, body, endPoint, token, customUrl, otherParams }) {
    try {

        let showLogs = false;
        if (process.env.API_URL === 'http://localhost:8000/dev') {
            showLogs = true;
        }

        var request = {
            method,
            url: `${process.env.API_URL}/${endPoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            body = JSON.parse(body);
            request.data = JSON.stringify(body);
        };
        if (token) request.headers["Authorization"] = token;
        if (customUrl) request.url = customUrl;
        if (otherParams && Object.keys(otherParams).length > 0) request = { ...otherParams, ...request };

        if (showLogs) {
            console.log('API Request \n', request);
        }

        const response = await axios(request);

        if (showLogs) {
            console.log('API Response \n', response);
        }

        return response;

    } catch (error) {
        log({ error, source: 'apiRequest' });
        throw error;
    }
};

module.exports = { apiRequest };
