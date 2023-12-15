const { createClient } = require('redis');
const constants = require('../../../config/constants');
const { log } = require('../../general/logger');

let redisClient;

async function connectToRedis() {
    try {
        redisClient = createClient({
            username: constants.DATABASES.REDIS.USERNAME,
            password: constants.DATABASES.REDIS.PASSWORD,
            socket: {
                host: constants.DATABASES.REDIS.HOST,
                port: constants.DATABASES.REDIS.PORT
            }
        });
        await redisClient.connect();
        log({ message: 'Connected to redis', source: 'connectToRedis' });
    } catch (error) {
        log({ error, source: 'connectToRedis' });
        throw error;
    }
}

async function getKey(key) {
    try {
        if (!redisClient) await connectToRedis();
        let response = await redisClient.get(key);
        try {
            if (typeof response === 'string') response = JSON.parse(response);
        } catch (error) {
            log({ error, source: 'getKey' });
        }
        return response;
    } catch (error) {
        log({ error, source: 'getKey' });
        throw error;
    }
}

async function setKey(key, value, expiryHours = 144) {
    try {
        if (typeof value === 'object') value = JSON.stringify(value);
        if (!redisClient) await connectToRedis();
        const response = await redisClient.set(key, value);
        if (expiryHours) {
            await redisClient.expire(key, expiryHours * 60 * 60);
        }
        return response;
    } catch (error) {
        log({ error, source: 'setKey' });
        throw error;
    }
}

async function deleteKey(key) {
    try {
        if (!redisClient) await connectToRedis();
        const response = await redisClient.delete(key);
        return response;
    } catch (error) {
        log({ error, source: 'deleteKey' });
        throw error;
    }
}

module.exports = { getKey, setKey, deleteKey };