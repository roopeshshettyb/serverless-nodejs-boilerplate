const { log } = require('../general/logger');
const User = require('../../users/user.model.js');
const constants = require('../../config/constants');
const { Op } = require('sequelize');
const { generatePresignedUrl } = require('../aws/s3/bucket');
const modelUniqueKeys = constants.MODEL_DEFAULTS.UNIQUE_KEYS;

const modelMapping = {
    [modelUniqueKeys.USERS]: { name: 'User', model: User }
};

const foreignKeysModelMapping = constants.MODEL_DEFAULTS.FOREIGN_KEY_MODEL_MAPPING;

async function createNewModelData(model, data) {
    try {
        const createdData = await modelMapping[model].model.create(data);
        return createdData;
    } catch (error) {
        log({ error, source: 'createNewModelData' });
        throw error;
    }
}

async function findByModelKeysValues(model, filterConditions, otherParams) {
    let dbResponse = [];
    let queryConditions = {};
    try {
        for (let key of Object.keys(filterConditions)) {
            if (key.includes('Ids')) {
                try {
                    if (filterConditions[key] && typeof filterConditions[key] === 'string') filterConditions[key] = JSON.parse(filterConditions[key]);
                } catch (error) {
                    //
                }
                filterConditions[key] = {
                    [Op.contains]: filterConditions[key]
                };
                continue;
            }
            if (key.includes('Id')) filterConditions[key] = parseInt(filterConditions[key]);
        }
        queryConditions.where = filterConditions;
        if (otherParams) queryConditions = { ...queryConditions, ...otherParams };
        let dbRawResponse = await modelMapping[model].model.findAll(queryConditions);
        if (otherParams && otherParams.rawResponse) {
            if (otherParams && otherParams.limit && otherParams.limit === 1) return dbRawResponse[0];
            return dbRawResponse;
        };
        dbResponse = dbRawResponse;
    } catch (error) {
        log({ error, source: 'findByModelKeysValues' });
    }
    if (otherParams && otherParams.limit && otherParams.limit === 1) return dbResponse[0];
    return dbResponse;
}

async function getRowCountByModel(model, filter = {}) {
    try {
        let count = await modelMapping[model].model.count(filter);
        return count;
    } catch (error) {
        log({ error, source: 'getRowCountByModel' });
    }
    return 0;
}

async function updateModelData(model, data, filterConditions) {
    try {
        let [updatedRowCount, updateResponse = []] = await modelMapping[model].model.update(data, { where: filterConditions, returning: true });
        return updateResponse;
    } catch (error) {
        log({ error, source: 'updateModelData' });
        throw error;
    }
}

async function deleteModelData(model, filterConditions) {
    try {
        let deleteResponse = await modelMapping[model].model.destroy({ where: filterConditions });
        return deleteResponse;
    } catch (error) {
        log({ error, source: 'deleteModelData' });
        throw error;
    }
}

async function getMandatoryColumnsOfModel(model) {
    try {
        let modelKeys = Object.keys(modelMapping[model].model.rawAttributes).filter((columnName) => {
            const attribute = modelMapping[model].model.rawAttributes[columnName];
            return !attribute.allowNull;
        });
        let internalColumns = ['id', 'createdAt', 'updatedAt'];
        if (model === modelUniqueKeys.USERS) internalColumns.push(...['active', 'role']);
        for (let column of internalColumns) {
            let idx = modelKeys.indexOf(column);
            if (idx > -1) {
                modelKeys.splice(idx, 1);
            }
        }
        return modelKeys;
    } catch (error) {
        log({ error, source: 'getMandatoryColumnsOfModel' });
        throw error;
    }
}

async function getColumnsRequiredForBulkCreate(model) {
    try {
        let modelKeys = await getMandatoryColumnsOfModel(model);
        return modelKeys;
    } catch (error) {
        log({ error, source: 'getColumnsRequiredForBulkCreate' });
        throw error;
    }
}

async function bulkCreateNewModelData(model, data) {
    try {
        const createdData = await modelMapping[model].model.bulkCreate(data);
        return createdData;
    } catch (error) {
        log({ error, source: 'bulkCreateNewModelData' });
        throw error;
    }
}


module.exports = { findByModelKeysValues, updateModelData, deleteModelData, modelMapping, createNewModelData, getMandatoryColumnsOfModel, getColumnsRequiredForBulkCreate, bulkCreateNewModelData, getRowCountByModel };