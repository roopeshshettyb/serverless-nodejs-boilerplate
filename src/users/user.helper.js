const { validateTokenAndGetClaims } = require('../common-services/auth/auth.delegate');
const { findByModelKeysValues } = require('../common-services/data/query');
const { checkFilesAndUploadToS3 } = require('../common-services/common.delegate.js');
const { log } = require('../common-services/general/logger');
const constants = require('../config/constants');
const userRouteKey = constants.MODEL_DEFAULTS.UNIQUE_KEYS.USERS;

async function checkIfUserExists(email) {
    try {
        const userData = await findByModelKeysValues(constants.MODEL_DEFAULTS.UNIQUE_KEYS.USERS, { email });
        if (userData.length > 0) {
            throw new Error('User Already exists');
        }
    } catch (error) {
        log({ error, source: 'checkIfUserExists' });
        throw error;
    }
    return true;
}

async function getToken(event) {
    let token = null;
    try {
        if (event && event.headers && event.headers.Authorization) {
            token = event.headers.Authorization;
        }
    } catch (error) {
        log({ error, source: 'getToken' });
    }
    return token;
}

async function getUserDetailsFromToken(token) {
    let details = [];
    try {
        if (token) {
            details = await validateTokenAndGetClaims(token);
        }
    } catch (error) {
        log({ error, source: 'getUserDetailsFromToken' });
    }
    return details;
}

async function uploadModelFiles(event, user) {
    try {
        const profilePictureS3Urls = await checkFilesAndUploadToS3(`${userRouteKey}/profile_pictures`, user.profilePicture, event.files);
        user.profilePicture = profilePictureS3Urls[0];
        return user;
    } catch (error) {
        log({ error, source: 'uploadModelFiles' });
        throw error;
    }
}

module.exports = { checkIfUserExists, getToken, getUserDetailsFromToken, uploadModelFiles, };