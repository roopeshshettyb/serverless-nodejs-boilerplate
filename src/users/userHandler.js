const { log } = require('../common-services/general/logger.js');
const constants = require('../config/constants');
const { customResponse } = require('../common-services/general/response.js');
const { middleware } = require('../common-services/general/middleware.js');
const { createUser, updateUser, loginUser, resetPassword } = require('./user.delegate.js');
const { checkIfActorHasPerms } = require('../common-services/auth/auth.helper.js');
const { uploadModelFiles, appendInstituteDetails } = require('./user.helper.js');

const defaultPermissions = constants.MODEL_DEFAULTS.PERMISSIONS;
const userRestrictedFields = ['active', 'role', 'permissions'];

async function createUserHandler(rawEvent, rawContext) {
  try {
    let { event, context } = await middleware(rawEvent, rawContext);
    let user = event.body;
    const requesterDetails = event && event.customFields ? event.customFields.userDetails : {};
    if (user.active && !(checkIfActorHasPerms(requesterDetails, 'USER', defaultPermissions.CREATE))) {
      throw Error('You are not authorized to create a new user');
    }
    user = await uploadModelFiles(event, user);
    const newUser = await createUser(user);
    let message = 'Registration Successful!';
    if (!newUser.active) {
      message = message + ' Your account is pending activation. You will be notified post activation.';
    }
    return customResponse({ data: newUser, success: true, statusCode: 201, message });
  } catch (error) {
    log({ error, source: 'createUserHandler' });
    return customResponse({ error });
  }
};

async function loginUserHandler(rawEvent, rawContext) {
  try {
    let { event, context } = await middleware(rawEvent, rawContext);
    let success = false;
    const user = event.body;
    let loggedInUser = await loginUser(user);
    if (loggedInUser.token) {
      success = true;
    } else {
      loggedInUser = {};
    }
    return customResponse({ data: loggedInUser, success, statusCode: 200, message: 'Login Successful!' });
  } catch (error) {
    log({ error, source: 'loginUserHandler' });
    return customResponse({ error });
  }
};

async function updateUserHandler(rawEvent, rawContext) {
  try {
    let { event, context } = await middleware(rawEvent, rawContext);
    let success = false;
    let updatedUserData = event.body;
    const requesterDetails = event.customFields.userDetails;
    const adminPerms = checkIfActorHasPerms(requesterDetails, 'USER', defaultPermissions.UPDATE);
    if (requesterDetails.email !== updatedUserData.email && !adminPerms && !updatedUserData.resetPwdToken) {
      throw Error('You cannot update the details of this user');
    }
    const restrictedKeysUpdate = Object.keys(updatedUserData).some((element) => userRestrictedFields.includes(element));
    if (restrictedKeysUpdate && !adminPerms) {
      throw Error(`You cannot update ${userRestrictedFields.join(',')} of this user`);
    }
    updatedUserData = await uploadModelFiles(event, updatedUserData);
    let updatedUser = await updateUser(updatedUserData);
    success = true;
    return customResponse({ data: updatedUser, success, statusCode: 200, message: 'User Updated Successfully!' });
  } catch (error) {
    log({ error, source: 'updateUserHandler' });
    return customResponse({ error });
  }
};

async function resetPasswordHandler(rawEvent, rawContext) {
  try {
    let { event, context } = await middleware(rawEvent, rawContext);
    let success = false;
    const userData = event.body;
    await resetPassword(userData);
    success = true;
    return customResponse({ message: 'An Email has been sent with a link to reset your password', success, statusCode: 200 });
  } catch (error) {
    log({ error, source: 'resetPasswordHandler' });
    return customResponse({ error });
  }
};

module.exports = { createUserHandler, loginUserHandler, updateUserHandler, resetPasswordHandler };

