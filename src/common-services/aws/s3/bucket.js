const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const constants = require('../../../config/constants');
const { log } = require('../../general/logger');

const awsConfig = {
    region: constants.AWS.S3.BUCKET_REGION,
    credentials: {
        accessKeyId: constants.AWS.CREDENTIALS.ACCESS_KEY,
        secretAccessKey: constants.AWS.CREDENTIALS.SECRET_ACCESS_KEY,
    }
};

let s3Client = null;

async function connectToBucket() {
    try {
        s3Client = new S3Client(awsConfig);
        log({ message: 'Connected to S3 Bucket', source: 'connectToBucket' });
    } catch (error) {
        log({ error, source: 'connectToBucket' });
        throw error;
    }
};

async function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
}

async function getObject(bucketName, key) {
    try {
        if (!s3Client) await connectToBucket();
        let params = { Bucket: bucketName, Key: key };
        let getObjCommand = new GetObjectCommand(params);
        const data = await s3Client.send(getObjCommand);
        if (key.includes('.csv')) {
            return await streamToString(data.Body);
        } else {
            return data;
        }
    } catch (error) {
        log({ error, source: 'getObject' });
        throw error;
    }
};

async function deleteObject(bucketName, key) {
    try {
        if (!s3Client) await connectToBucket();
        const params = { Bucket: bucketName, Key: key };
        return await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        log({ error, source: 'deleteObject' });
        throw error;
    }
};

async function putObject(bucketName, key, data, otherParams = null) {
    try {
        if (!s3Client) await connectToBucket();
        let params = { Bucket: bucketName, Key: key, Body: data };
        if (bucketName === constants.AWS.S3.PUBLIC_BUCKET_NAME) params.ACL = 'public-read';
        if (otherParams) {
            params = { ...params, ...otherParams };
        }
        return await s3Client.send(new PutObjectCommand(params));
    } catch (error) {
        log({ error, source: 'putObject' });
        throw error;
    }
};

const generatePresignedUrl = async (s3Url = null, expiry = 3600, s3Key = null, s3BucketName = null) => {
    let objectKey;
    let bucketName;
    if (s3Url) {
        const urlParts = new URL(s3Url);
        bucketName = urlParts.hostname.split('.')[0];
        objectKey = urlParts.pathname.substring(1);
    } else {
        bucketName = s3BucketName;
        objectKey = s3Key;
    }
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
    });
    try {
        if (!s3Client) await connectToBucket();
        const url = await getSignedUrl(s3Client, command, { expiresIn: expiry });
        return url;
    } catch (error) {
        log({ error, source: 'generatePresignedUrl' });
        throw error;
    }
};

module.exports = { connectToBucket, getObject, deleteObject, putObject, generatePresignedUrl };
