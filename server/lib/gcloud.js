if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = process.env.GAE_LONG_APP_ID;
}

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
    require("@google/cloud-trace").start();
    require("@google/cloud-debug").start();
    errorHandler = require("@google/cloud-errors").start();
}

export const errors = errorHandler;

export default require("google-cloud")({
    projectId: process.env.GCLOUD_PROJECT || process.env.GAE_LONG_APP_ID
});
