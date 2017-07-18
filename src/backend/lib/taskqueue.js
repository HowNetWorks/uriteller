const gcloud = require("./gcloud");

const pubsub = gcloud.pubsub();

function _topic(name) {
  return pubsub.createTopic(name)
    .then(
        data => data[0],
        err => {
          if (err.code === 409) {
            return pubsub.topic(name);
          }
          throw err;
        }
      );
}

function _subscribe(topic, subName) {
  const config = {
    maxInProgress: 512,
    ackDeadlineSeconds: 120
  };
  return topic.subscribe(subName, config).then(data => data[0]);
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
  return _topic(topicName).then(topic => topic.publish(data));
};
