function checkIfActorHasPerms(actorDetails, entity, requiredPerm) {
    if (!actorDetails) {
        return false;
    }
    if (actorDetails && !actorDetails.permissions) {
        return false;
    }
    if (!actorDetails.permissions[entity]) {
        return false;
    }
    if (!actorDetails.permissions[entity].includes(requiredPerm)) {
        return false;
    }
    return true;
};

module.exports = { checkIfActorHasPerms };