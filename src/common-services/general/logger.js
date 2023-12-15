function log({ message, data = null, trails = null, error = null, source = null }) {
    const logObject = {
        message
    };

    if (error) {
        logObject.error = error instanceof Error ? error.message : error;
    }

    if (data) {
        logObject.data = data;
    }

    if (trails) {
        logObject.trails = trails;
    }

    if (source) {
        logObject.function = source;
    }

    console.log(JSON.stringify(logObject, null, 2));
    return true;
}

module.exports = { log };