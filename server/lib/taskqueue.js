const gcloud = require("google-cloud")({
    projectId: process.env.GCLOUD_PROJECT || process.env.GAE_LONG_APP_ID
});

const pubsub = gcloud.pubsub();

function _topic(name) {
    return new Promise((resolve, reject) => {
        pubsub.createTopic(name, (err, topic) => {
            if (!err) {
                return resolve(topic);
            }
            if (err.code !== 409) {
                return reject(err);
            }
            return resolve(pubsub.topic(name));
        });
    });
}

function _subscribe(topicObj, subName) {
    return new Promise((resolve, reject) => {
        topicObj.subscribe(subName, { reuseExisting: true }, (err, sub) => {
            if (err) {
                return reject(err);
            }
            resolve(sub);
        });
    });
}

function _publish(topicObj, data) {
    return new Promise((resolve, reject) => {
        topicObj.publish({ data: data }, err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

exports.subscribe = function(topicName, subName, handler) {
    return _topic(topicName)
        .then(topic => _subscribe(topic, subName))
        .then(
            sub => {
                function onMsg(msg) {
                    handler(null, msg);
                }
                function onErr(err) {
                    sub.removeListener("message", onMsg);
                    sub.removeListener("error", onErr);
                    handler(err, null);
                }
                sub.on("message", onMsg);
                sub.on("error", onErr);
            },
            err => {
                handler(err, null);
            }
        );
};

exports.publish = function(topicName, data) {
    return _topic(topicName).then(topic => _publish(topic, data));
};
