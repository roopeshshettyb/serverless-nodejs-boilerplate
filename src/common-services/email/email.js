const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { log } = require('../general/logger');
const constants = require('../../config/constants');
const { bareBonesHtmlString } = require('./templates/bareBonesTemplate.js');
const { basicMailHtmlStringContent } = require('./templates/basicMailTemplate');
let transporter = null;

const templateMapping = {
    basicMailTemplate: basicMailHtmlStringContent
};

function getTransporter() {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            constants.EMAIL.CLIENT_ID,
            constants.EMAIL.CLIENT_SECRET,
            constants.EMAIL.REDIRECT_URL
        );

        oAuth2Client.setCredentials({
            refresh_token: constants.EMAIL.REFRESH_TOKEN,
        });

        let accessToken;

        try {
            oAuth2Client.refreshAccessToken(function (error, tokens) {
                if (error) {
                    log({ error, source: 'getTransporter-refreshAccessToken' });
                }
                accessToken = tokens ? tokens.access_token : null;
            });
        } catch (error) {
            log({ error, source: 'getTransporter-refreshAccessToken' });
        }

        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: constants.EMAIL.EMAIL_ADDRESS,
                clientId: constants.EMAIL.CLIENT_ID,
                clientSecret: constants.EMAIL.CLIENT_SECRET,
                refreshToken: constants.EMAIL.REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });
    } catch (error) {
        log({ error, source: 'getTransporter' });
    }
}

async function sendMail({ to, cc, subject, params, attachments, template }) {
    try {
        if (!transporter) {
            transporter = getTransporter();
        }
        const emailObj = {
            from: constants.EMAIL.EMAIL_ADDRESS,
            to: to,
            subject: subject,
            attachments: attachments || [], // Attachments should be an array of objects [{ filename, path }]
        };
        let basicHtml = templateMapping[template](params);
        let html = bareBonesHtmlString(constants.APPLICATION_DETAILS.THEME_COLOR, constants.APPLICATION_DETAILS.LOGO, basicHtml);
        emailObj.html = html;
        if (cc) emailObj.cc = cc;
        const info = await transporter.sendMail(emailObj);
        return info.response;
    } catch (error) {
        log({ error, source: 'sendMail' });
        throw error;
    }
}

module.exports = { getTransporter, sendMail, templateMapping };
