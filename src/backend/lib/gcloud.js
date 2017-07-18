let errorHandler = {
  report(err) {
    // eslint-disable-next-line no-console
    console.error(err);
  },
  express(req, res, next) {
    next();
  }
};

if (process.env.NODE_ENV === "production") {
  require("@google-cloud/trace-agent").start();
  require("@google-cloud/debug-agent").start();
  errorHandler = require("@google-cloud/error-reporting")();
}

module.exports = {
  pubsub() {
    return require("@google-cloud/pubsub")();
  },
  datastore() {
    return require("@google-cloud/datastore")();
  },
  errors: errorHandler
};
