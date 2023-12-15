const { log } = require('./general/logger');
const { putObject } = require('./aws/s3/bucket');
const constants = require('../config/constants');
const { sendToQueue } = require('./aws/sqs/queue');
const { sendMail, } = require('./email/email');
async function sendEmailQueueConsumerProcessing(data) {
    try {
        let emailPromises = [];
        for (let emailObj of data) {
            emailPromises.push(sendMail(emailObj));
        }
        await Promise.allSettled(emailPromises);
        log({ message: 'Emails successfully sent', trails: data });
        return true;
    } catch (error) {
        log({ error, source: 'sendEmailQueueConsumerProcessing' });
        throw error;
    }
}

async function sendEmailToQueue(data) {
    try {
        let emailArrayChunks = [];
        for (let i = 0; i < data.length; i = i + constants.EMAIL.MAX_LIMIT_IN_QUEUE) {
            emailArrayChunks.push(data.slice(i, i + constants.EMAIL.MAX_LIMIT_IN_QUEUE));
        }
        for (let chunk of emailArrayChunks) {
            await sendToQueue(constants.AWS.SQS.SEND_EMAIL.QUEUE_URL, chunk);
        }
    } catch (error) {
        log({ error, source: 'sendEmailToQueue' });
    }
}

async function checkFilesAndUploadToS3(s3Prefix, fileNames, files = [], privateBucket = false) {
    try {
        if (files.length === 0) { return []; }
        let bucketName = privateBucket ? constants.AWS.S3.PRIVATE_BUCKET_NAME : constants.AWS.S3.PUBLIC_BUCKET_NAME;
        let bucketUrl = privateBucket ? constants.AWS.S3.PRIVATE_URL_PREFIX : constants.AWS.S3.PUBLIC_URL_PREFIX;
        let s3Urls = [];
        const uploadPromises = [];
        for (let fileName of fileNames) {
            let s3Key = `${s3Prefix}/${Date.now()}__${fileName}`;
            s3Key = s3Key.replace(' ', '_');
            uploadPromises.push(putObject(bucketName, s3Key, files[fileName].content, { 'ContentType': files[fileName].contentType }));
            s3Urls.push(`${bucketUrl}/${s3Key}`);
        }
        await Promise.allSettled(uploadPromises);
        return s3Urls;
    } catch (error) {
        log({ error, source: 'checkFilesAndUploadToS3' });
    }
}

module.exports = { sendEmailQueueConsumerProcessing, sendEmailToQueue, checkFilesAndUploadToS3 };