const jwt = require('jsonwebtoken');
const constants = require('../../config/constants');
const { log } = require('../general/logger');
const bcrypt = require('bcryptjs');

const secretKey = constants.AUTH.JWT_SECRET;
const saltRounds = constants.AUTH.HASHING_SALT_ROUNDS;
const tokenExpiryInHours = constants.AUTH.TOKEN_EXPIRY_IN_HOURS;

async function createToken(claims, expiry = tokenExpiryInHours) {
    try {
        const token = jwt.sign(claims, secretKey, { expiresIn: `${expiry}h` });
        return token;
    } catch (error) {
        log({ error, source: 'createToken' });
        throw error;
    }
};

async function validateTokenAndGetClaims(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (error) {
        log({ error, source: 'validateTokenAndGetClaims' });
        throw error;
    }
};

async function hashPassword(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        log({ error, source: 'hashPassword' });
        throw error;
    }
};

async function comparePassword(plaintextPassword, hashedPassword) {
    try {
        const match = await bcrypt.compare(plaintextPassword, hashedPassword);
        return match;
    } catch (error) {
        log({ error, source: 'comparePassword' });
        throw error;
    }
};

module.exports = { validateTokenAndGetClaims, createToken, hashPassword, comparePassword };