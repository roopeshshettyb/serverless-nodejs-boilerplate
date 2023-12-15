const { hashPassword, createToken, comparePassword, validateTokenAndGetClaims } = require('../common-services/auth/auth.delegate.js');
const { log } = require('../common-services/general/logger.js');
const { checkIfUserExists, appendInstituteDetails } = require('./user.helper');
const { updateModelData, createNewModelData, findByModelKeysValues } = require('../common-services/data/query');
const constants = require('../config/constants.js');
const { sendMail } = require('../common-services/email/email.js');
const modelDefaultKeys = constants.MODEL_DEFAULTS.UNIQUE_KEYS;

async function createUser(user) {
    try {
        await checkIfUserExists(user.email);
        let password = user.password;
        user.password = await hashPassword(password);
        const newUser = await createNewModelData(modelDefaultKeys.USERS, user);
        newUser.password = password;
        const { dbUser, token } = await loginUser(newUser);
        return { dbUser, token };
    } catch (error) {
        log({ error, source: 'createUser' });
        throw error;
    }
}

async function updateUser(updatedUserData) {
    try {
        if (updatedUserData.password) {
            const claims = await validateTokenAndGetClaims(updatedUserData.resetPwdToken);
            updatedUserData.email = claims.email;
            updatedUserData.password = await hashPassword(updatedUserData.password);
        }
        const updateResponse = await updateModelData(modelDefaultKeys.USERS, updatedUserData, { email: updatedUserData.email });
        let dbUser = updateResponse[0].dataValues;
        delete dbUser.password;
        let newToken = await createToken(dbUser);
        return { dbUser: dbUser, token: newToken };
    } catch (error) {
        log({ error, source: 'updateUser' });
        throw error;
    }
};

async function loginUser(user) {
    let token = null;
    try {
        let dbUser = await findByModelKeysValues(modelDefaultKeys.USERS, { email: user.email }, { limit: 1 });
        if (!dbUser) {
            throw Error('User does not exist. Please check your email and password and try again.');
        }
        let modifiedUser = await appendInstituteDetails({ dbUser: dbUser });
        dbUser = modifiedUser.dbUser;
        const match = await comparePassword(user.password, dbUser.password);
        if (!match) {
            throw Error('Incorrect password provided');
        }
        delete dbUser.password;
        if (dbUser.active) {
            token = await createToken(dbUser);
        }
        return { token, dbUser: dbUser };

    } catch (error) {
        log({ error, source: "loginUser" });
        throw error;
    }
};

async function resetPassword(user) {
    try {
        const dbUser = await findByModelKeysValues(modelDefaultKeys.USERS, { email: user.email }, { limit: 1 });
        if (!dbUser) {
            throw Error('Account does not exist. Please sign up.');
        }
        const resetTokenValidity = 6;
        const resetPwdToken = await createToken(user, resetTokenValidity);
        const emailObj = {
            to: user.email,
            subject: `Reset ${constants.APPLICATION_DETAILS.NAME} Account Password`,
            template: 'resetPasswordTemplate',
            params: {
                heading: `Please use the below link to reset your password. The link is valid for ${resetTokenValidity} hours`,
                resetPasswordLink: `${constants.REACT_APP.URL}/${constants.REACT_APP.ROUTES.RESET_PASSWORD}?token=${resetPwdToken}`,
                newResetPasswordLink: `${constants.REACT_APP.URL}/${constants.REACT_APP.ROUTES.RESET_PASSWORD}`
            }
        };
        await sendMail(emailObj);
        return true;
    } catch (error) {
        log({ error, source: "resetPassword" });
        throw error;
    }
}

module.exports = { createUser, updateUser, loginUser, resetPassword };