const { SQSClient, SendMessageCommand, ReceiveMessageCommand } = require('@aws-sdk/client-sqs');
const constants = require('../../../config/constants');
const { log } = require('../../general/logger');

const awsConfig = {
    region: constants.AWS.SQS.REGION,
    credentials: {
        accessKeyId: constants.AWS.CREDENTIALS.ACCESS_KEY,
        secretAccessKey: constants.AWS.CREDENTIALS.SECRET_ACCESS_KEY,
    },
};

let sqsClient = null;

async function connectClient() {
    try {
        sqsClient = new SQSClient(awsConfig);
    } catch (error) {
        log({ error, source: 'connectClient' });
    }
}

async function sendToQueue(queueUrl, message) {
    let response = {};
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
    };
    try {
        if (!sqsClient) connectClient();
        await sqsClient.send(new SendMessageCommand(params));
        response = { message: "Message sent successfully" };
        log({ data: { response, params } });
        return response;
    } catch (error) {
        log({ error, message: 'Message sending failed' });
        throw error;
    }
};

async function consumeFromQueue(queueUrl) {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        AttributeNames: ["All"],
    };
    try {
        if (!sqsClient) connectClient();
        const { Messages } = await sqsClient.send(new ReceiveMessageCommand(params));
        if (Messages && Messages.length > 0) {
            log({ data: Messages[0].body, message: 'Message received' });
            return Messages[0].body;
        } else {
            return {};
        }
    } catch (error) {
        log({ error, message: 'Error consuming message from queue' });
        throw error;
    }
};

module.exports = { sendToQueue, consumeFromQueue };