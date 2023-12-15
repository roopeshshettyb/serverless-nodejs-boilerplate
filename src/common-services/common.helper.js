const constants = require('../config/constants');
const { checkIfActorHasPerms } = require('./auth/auth.helper');
const { getKey } = require('./aws/redis/redis');
const { getObject } = require('./aws/s3/bucket');
const { modelMapping, getColumnsRequiredForBulkCreate, bulkCreateNewModelData } = require('./data/query');
const { log } = require('./general/logger');
const xlsx = require('xlsx');
const csv = require('csvtojson');
const { hashPassword } = require('./auth/auth.delegate');

const defaultPermissions = constants.MODEL_DEFAULTS.PERMISSIONS;

const sequelizeToMuiTextFieldMapping = {
    STRING: 'text',
    INTEGER: 'number',
    FLOAT: 'text',
    DATEONLY: 'date',
    'ARRAY(STRING)': 'text',
    JSON: 'textarea',
    TEXT: 'textarea',
    BLOB: 'file',
    ARRAY: 'textarea'
};

const customMapping = {
    profilePicture: { type: 'FILE', multiple: false, subType: ['image'] },
    logo: { type: 'FILE', multiple: false, subType: ['image'] },
    documents: { type: 'FILE', multiple: true, subType: ['pdf'] },
    resume: { type: 'FILE', multiple: false, subType: ['pdf'] },
    offerLetter: { type: 'FILE', multiple: false, subType: ['pdf'] },
    jobDescription: { type: 'RICHTEXT' },
    jobDescriptionPdfLink: { type: 'FILE', multiple: false, subType: ['pdf'] }
};

async function createBase64ExcelToCsv(base64String, model) {
    try {
        const workbook = xlsx.read(base64String, { type: 'base64' });
        const csvData = xlsx.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        const modelKeys = await getColumnsRequiredForBulkCreate(model);
        const data = await convertCsvStringToJson(csvData);
        const csvKeys = Object.keys(data[0]);
        for (let key of modelKeys) {
            if (!csvKeys.some(column => column === key)) {
                throw Error(`Please ensure all the mandatory columns are given and the column names match exactly with the format. Please find the list of mandatory columns -> ${modelKeys.join(',')}`);
            }
        }
        return csvData;
    } catch (error) {
        log({ error, source: 'createBase64ExcelToCsv' });
        throw error;
    }
}

async function convertCsvStringToJson(csvString, startRow = 1, endRow) {
    try {
        const jsonData = await csv().fromString(csvString);
        const jsonSubset = jsonData.slice(startRow - 1, endRow);
        return jsonSubset;
    } catch (error) {
        log({ error, source: 'convertCsvStringToJson' });
        throw error;
    }
}

async function makeCsvChunks(header, csvData, chunkSize = constants.CSV_BATCHING.CHUNK_SIZE) {
    try {
        let chunks = [];
        for (let i = 0; i < csvData.length; i = i + chunkSize) {
            chunks.push([header, ...csvData.slice(i, i + chunkSize)].join('\n'));
        }
        return chunks;
    } catch (error) {
        log({ error, source: 'makeCsvChunks' });
        throw error;
    }
}

async function getCsvChunks(s3Key, chunkSize) {
    try {
        const csvData = await getObject(constants.AWS.S3.PRIVATE_BUCKET_NAME, s3Key);
        let allRows = csvData.split('\n');
        const header = allRows[0];
        allRows.splice(0, 1);
        const chunks = await makeCsvChunks(header, allRows, chunkSize);
        return chunks;
    } catch (error) {
        log({ error, source: 'getCsvChunks' });
        throw error;
    }
};

async function batchCsvIntoChunks(data, chunkSize) {
    try {
        const chunks = await getCsvChunks(data.s3Key, chunkSize);
        return chunks;
    } catch (error) {
        log({ error, source: 'batchCsvIntoChunks' });
        throw error;
    }
}

function convertArrayToCsv(jsonArray) {
    try {
        const headers = Object.keys(jsonArray[0]);
        const jsonArrayData = jsonArray.map(obj => {
            return headers.map(key => {
                let value = obj[key];
                if (typeof value === 'string' && value.includes(',')) {
                    // Escape the value with double quotes if it contains a comma
                    value = `"${value}"`;
                }
                return value;
            }).join(',');
        });
        const headerString = headers.map(header => {
            if (header.includes(',')) {
                return `"${header}"`; // Wrap header with double quotes if it contains a comma
            }
            if (header.includes('\n')) {
                return `"${header.replace('\n', '')}"`; // Wrap header with double quotes if it contains a comma
            }
            return header;
        }).join(',');
        const csvString = [headerString, ...jsonArrayData].join('\n');
        return csvString;
    } catch (error) {
        log({ error, source: 'convertArrayToCsv' });
        throw error;
    }
}

function getConstants() {
    try {
        let constantsForReact = JSON.parse(JSON.stringify(constants));
        const keysToDelete = ['AUTH', 'DATABASES', 'EMAIL', 'AWS'];
        for (let key of keysToDelete) {
            delete constantsForReact[key];
        }
        return constantsForReact;
    } catch (error) {
        log({ error, source: 'getConstants' });
        return [];
    }
}

function toTitleCase(str) {
    return str
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getModelFields(model, operationType) {

    function getAttributeLabel(attribute) {
        if (attribute.customLabel) return attribute.customLabel;
        return toTitleCase(attribute.fieldName);
    }

    try {
        const modelAttributes = modelMapping[model].model.rawAttributes;
        const createRestrictedFields = ['id', 'active', 'permissions', 'createdAt', 'updatedAt',];
        let updateRestrictedFields = createRestrictedFields;
        if (model === constants.MODEL_DEFAULTS.UNIQUE_KEYS.USERS) updateRestrictedFields = ['email', 'role', ...createRestrictedFields];
        const restrictedFields = operationType === 'CREATE' ? createRestrictedFields : updateRestrictedFields;
        const customMappedAttributeKeyTypes = ['DATE'];
        let attributes = [];
        for (let key of Object.keys(modelAttributes)) {
            let attribute = modelAttributes[key];
            console.log(attribute.type.key);
            if (!restrictedFields.includes(attribute.fieldName)) {
                if (sequelizeToMuiTextFieldMapping[attribute.type.key] && !customMapping[attribute.fieldName] && !customMappedAttributeKeyTypes.includes(attribute.type.key)) {
                    attributes.push({
                        required: !attribute.allowNull,
                        label: getAttributeLabel(attribute),
                        key: attribute.fieldName,
                        type: sequelizeToMuiTextFieldMapping[attribute.type.key],
                        componentType: 'TextField'
                    });
                }
                if (attribute.type.key === 'DATE') {
                    attributes.push({
                        required: !attribute.allowNull,
                        label: getAttributeLabel(attribute),
                        key: attribute.fieldName,
                        componentType: 'DateTimePicker'
                    });
                }
                if (attribute.type.key === 'ENUM') {
                    attributes.push({
                        required: !attribute.allowNull,
                        label: getAttributeLabel(attribute),
                        key: attribute.fieldName,
                        options: attribute.values,
                        componentType: 'Select'
                    });
                }
                if (attribute.type.key === 'BOOLEAN') {
                    attributes.push({
                        required: !attribute.allowNull,
                        label: getAttributeLabel(attribute),
                        key: attribute.fieldName,
                        componentType: 'CheckBox'
                    });
                }
                if (customMapping[attribute.fieldName]) {
                    if (customMapping[attribute.fieldName].type === 'FILE') {
                        attributes.push({
                            required: !attribute.allowNull,
                            label: getAttributeLabel(attribute),
                            key: attribute.fieldName,
                            componentType: 'File',
                            multiple: customMapping[attribute.fieldName].multiple,
                            subType: customMapping[attribute.fieldName].subType
                        });
                    }
                    if (customMapping[attribute.fieldName].type === 'RICHTEXT') {
                        attributes.push({
                            required: !attribute.allowNull,
                            label: getAttributeLabel(attribute),
                            key: attribute.fieldName,
                            componentType: 'RichText'
                        });
                    }
                }
            }
        }
        return attributes;
    } catch (error) {
        log({ error, source: 'getModelFields' });
        throw error;
    }
}

function getAllModelFields(operationTypes) {
    try {
        let mapping = {};
        for (let type of operationTypes) {
            mapping[type] = {};
            for (let key of Object.keys(modelMapping)) {
                mapping[type][key] = getModelFields(key.toLowerCase(), type);
            }
        }
        return mapping;
    } catch (error) {
        log({ error, source: 'getAllModelFields' });
        throw error;
    }
}

module.exports = { createBase64ExcelToCsv, convertCsvStringToJson, makeCsvChunks, getCsvChunks, batchCsvIntoChunks, convertArrayToCsv, getConstants, toTitleCase, getModelFields, getAllModelFields };